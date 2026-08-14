import { pino } from "pino";
import { env } from "../config/env.js";

const isDevelopment = env.NODE_ENV === "development";

/**
 * Shared Pino logger instance.
 *
 * - Structured JSON output in production (machine-readable).
 * - Pretty-printed output in development via `pino-pretty`.
 * - Sensitive fields (auth headers, cookies) are redacted.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
    ],
    censor: "[Redacted]",
  },
  ...(isDevelopment
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        },
      }
    : {}),
});


