import { deleteObjects, isR2Configured, listObjects } from "../lib/r2.lib.js";
import {
  findReferencedR2Keys,
  markStaleAnalysesFailed,
} from "../repositories/meal-analyses.repositories.js";
import { logger } from "../utils/logger.utils.js";

export const SWEEP_STALLED_JOB_NAME = "sweep-stalled";
export const SWEEP_ORPHANS_JOB_NAME = "sweep-orphans";

/** Rows stuck before a terminal state for longer than this are reaped. */
export const STALLED_AFTER_MIN = 30;
/** Uploads younger than this may still be in flight — never sweep them. */
export const ORPHAN_GRACE_HOURS = 24;
const ORPHAN_LIST_PAGES = 5;
const ORPHAN_PAGE_SIZE = 1000;

/** Fails QUEUED/PROCESSING rows the worker evidently lost (crash, deploy). */
export async function sweepStalledAnalyses(): Promise<{ failed: number }> {
  const before = new Date(Date.now() - STALLED_AFTER_MIN * 60_000);
  const failed = await markStaleAnalysesFailed(before);
  if (failed > 0) {
    logger.info({ failed }, "Swept stalled meal analyses");
  }
  return { failed };
}

/**
 * Deletes R2 objects that are old enough to no longer be in flight yet are
 * referenced by no MealAnalysis row (abandoned presigns, rejected uploads,
 * leftovers). Paginates defensively; repeats daily.
 */
export async function sweepOrphanUploads(): Promise<{ deleted: number }> {
  if (!isR2Configured()) {
    logger.warn("Skipping orphan sweep: R2 is not configured");
    return { deleted: 0 };
  }

  const graceCutoff = Date.now() - ORPHAN_GRACE_HOURS * 3_600_000;
  let continuationToken: string | undefined;
  let deleted = 0;

  for (let page = 0; page < ORPHAN_LIST_PAGES; page++) {
    const { objects, nextToken } = await listObjects("meals/", ORPHAN_PAGE_SIZE, continuationToken);
    const candidates = objects
      .filter(
        (object) =>
          object.key.endsWith(".jpg") && (object.lastModified?.getTime() ?? 0) < graceCutoff,
      )
      .map((object) => object.key);
    if (candidates.length > 0) {
      const referenced = await findReferencedR2Keys(candidates);
      const orphans = candidates.filter((key) => !referenced.has(key));
      deleted += await deleteObjects(orphans);
    }
    continuationToken = nextToken;
    if (continuationToken === undefined) break;
  }

  if (deleted > 0) {
    logger.info({ deleted }, "Swept orphan meal uploads");
  }
  return { deleted };
}
