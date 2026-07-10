import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http.js";
import { AppError } from "../errors/app-error.js";
import { NotFoundError } from "../errors/domain-errors.js";
import { logger } from "../utils/logger.js";

type ErrorResponse = {
  readonly error: string;
};

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(req.originalUrl));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const appError = normalizeError(error);

  logger.error(appError.message, {
    name: appError.name,
    statusCode: appError.statusCode,
    cause: appError.cause,
  });

  const response: ErrorResponse = { error: appError.message };

  res.status(appError.statusCode).json(response);
}

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError("Error fetching AI guidance", {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      isOperational: false,
      cause: error.message,
    });
  }

  return new AppError("Unexpected server error", {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational: false,
    cause: error,
  });
}
