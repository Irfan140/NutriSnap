import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
}

function isPayloadTooLargeError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const err = error as { type?: unknown; status?: unknown };
  return err.type === "entity.too.large" || err.status === 413;
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (isPayloadTooLargeError(error)) {
    res.status(413).json({ error: "Image is too large. Please upload a smaller image." });
    return;
  }

  // Use the per-request child logger (with request id) when available, otherwise
  // fall back to the shared logger (e.g. for body-parser errors that occur before
  // the request logger middleware runs).
  const log = req.log ?? logger;
  log.error({ err: error, method: req.method, url: req.originalUrl }, "Unhandled server error");

  res.status(500).json({ error: "Internal server error" });
}
