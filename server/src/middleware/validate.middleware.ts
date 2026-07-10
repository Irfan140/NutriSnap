import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny, z } from "zod";
import { ValidationError } from "../errors/domain-errors.js";

export function validateBody<TSchema extends ZodTypeAny>(schema: TSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(new ValidationError(result.error.issues[0]?.message ?? "Invalid request body", result.error.flatten()));
      return;
    }

    req.body = result.data as z.infer<TSchema>;
    next();
  };
}

