import type { Request, Response } from "express";
import { pinoHttp } from "pino-http";
import { logger } from "../utils/logger.js";

/**
 * Request logging middleware (pino-http).
 *
 * Logs every completed request with method, url, status code and response time.
 * The authenticated user id is attached when available, and auth headers are
 * redacted by the shared logger's redaction config.
 */
export const requestLogger = pinoHttp<Request, Response>({
  logger,
  autoLogging: {
    ignore: (req) => req.url === "/health",
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customProps: (req) => ({
    userId: req.auth?.userId,
  }),
});


