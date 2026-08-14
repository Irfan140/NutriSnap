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

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (isPayloadTooLargeError(error)) {
    res.status(413).json({ error: "Image is too large. Please upload a smaller image." });
    return;
  }

  logger.error("Unexpected server error", { error });
  res.status(500).json({ error: "Internal server error" });
}
