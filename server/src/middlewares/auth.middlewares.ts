import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth.lib.js";

/**
 * Requires a valid Better Auth session via `auth.api.getSession`. Accepts the
 * session token as `Authorization: Bearer <token>` (the `bearer()` plugin in
 * `auth.lib.ts` lets Better Auth read it) and keeps the external API contract:
 * unauthenticated requests get a `401`.
 *
 * On success, attaches the authenticated Better Auth user id to `req.auth`
 * for downstream handlers. Unexpected session-lookup failures are forwarded
 * to the global `errorHandler` via `next(err)`.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  let session: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  } catch (error) {
    next(error);
    return;
  }

  const userId = session?.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized: missing or invalid session token." });
    return;
  }

  req.auth = { userId };
  next();
}
