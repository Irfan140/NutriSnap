import { HTTP_STATUS } from "../constants/http.js";

type AppErrorOptions = {
  readonly statusCode?: number;
  readonly isOperational?: boolean;
  readonly cause?: unknown;
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.statusCode = options.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    this.isOperational = options.isOperational ?? true;

    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

