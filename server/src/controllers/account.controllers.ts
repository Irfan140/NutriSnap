import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { deleteObjects, isR2Configured } from "../lib/r2.lib.js";
import { deleteUserByClerkId } from "../repositories/users.repositories.js";
import {
  deleteAnalysisById,
  findAllUserAnalysisKeys,
} from "../repositories/meal-analyses.repositories.js";
import { removeAnalysisJob } from "../queues/meal-analysis.queues.js";
import { deleteClerkUser, ensureUser } from "../services/clerk-sync.services.js";
import { logger } from "../utils/logger.utils.js";

type ErrorResponse = {
  readonly error: string;
};

export type AccountDeps = {
  readonly ensureUser: typeof ensureUser;
  readonly findAllUserAnalysisKeys: typeof findAllUserAnalysisKeys;
  readonly removeAnalysisJob: typeof removeAnalysisJob;
  readonly deleteAnalysisById: typeof deleteAnalysisById;
  readonly deleteObjects: typeof deleteObjects;
  readonly deleteUserByClerkId: typeof deleteUserByClerkId;
  readonly deleteClerkUser: typeof deleteClerkUser;
};

const defaultDeps: AccountDeps = {
  ensureUser,
  findAllUserAnalysisKeys,
  removeAnalysisJob,
  deleteAnalysisById,
  deleteObjects,
  deleteUserByClerkId,
  deleteClerkUser,
};

export function createAccountController(deps: AccountDeps = defaultDeps) {
  /**
   * Full self-serve erasure, data-first so a failure never strands data
   * without an owner: drop queued jobs → delete private R2 objects
   * (best-effort; the orphan sweeper backstops) → delete rows (cascades
   * meal analyses) → delete the Clerk user last.
   */
  const deleteAccount: RequestHandler<ParamsDictionary, ErrorResponse> = async (
    req,
    res,
  ): Promise<void> => {
    const clerkId = req.auth?.userId;
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized: missing or invalid session token." });
      return;
    }

    const user = await deps.ensureUser(clerkId);
    const analyses = await deps.findAllUserAnalysisKeys(user.id);

    await Promise.all(analyses.map((analysis) => deps.removeAnalysisJob(analysis.id)));

    if (isR2Configured()) {
      try {
        await deps.deleteObjects(analyses.map((analysis) => analysis.r2Key));
      } catch (error) {
        logger.warn(
          { err: error, userId: user.id },
          "Failed to delete some R2 objects during account erasure",
        );
      }
    }

    await deps.deleteUserByClerkId(clerkId);

    try {
      await deps.deleteClerkUser(clerkId);
    } catch (error) {
      logger.error({ err: error, clerkId }, "Account data erased but Clerk removal failed");
      res.status(502).json({
        error: "Your data was deleted, but account removal needs support. Please contact us.",
      });
      return;
    }

    res.status(204).end();
  };

  return { deleteAccount };
}
