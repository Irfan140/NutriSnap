import { HTTP_STATUS } from "../constants/http.js";
import { AppError } from "./app-error.js";

export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, { statusCode: HTTP_STATUS.BAD_REQUEST, cause });
  }
}

export class AIResponseError extends AppError {
  constructor(message = "AI returned invalid nutrition data. Please try again with a clearer food image.", cause?: unknown) {
    super(message, { statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY, cause });
  }
}

export class ImageError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, { statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY, cause });
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
  }
}

export class NotFoundError extends AppError {
  constructor(path: string) {
    super(`Route not found: ${path}`, { statusCode: HTTP_STATUS.NOT_FOUND });
  }
}

