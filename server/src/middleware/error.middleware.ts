import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  logger.error("Unexpected server error", { error });
  res.status(500).json({ error: "Internal server error" });
}
