import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

/**
 * Requires a valid Clerk session. Relies on `clerkMiddleware()` (registered in
 * `app.ts`) which verifies the incoming `Authorization: Bearer <token>` header and
 * exposes the resolved auth object via `getAuth()`.
 *
 * On success, attaches the authenticated user id to `req.auth` for downstream
 * handlers. Rejects unauthenticated requests with a `401` JSON response.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized: missing or invalid session token." });
    return;
  }

  req.auth = { userId };
  next();
}
