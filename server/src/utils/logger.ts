import { pino } from "pino";
import { env } from "../config/env.js";

/**
 * Shared Pino logger instance.
 *
 * - Structured JSON output in production/serverless (e.g. Vercel).
 * - Pretty-printed output only in local development via `pino-pretty`
 *   (a devDependency that is not installed in production).
 * - Sensitive fields (auth headers, cookies) are redacted.
 *
 * We check the raw `process.env.NODE_ENV` rather than the parsed
 * `env.NODE_ENV` (which defaults to "development") so that an unset
 * NODE_ENV safely falls back to JSON logging.
 */
const isDevelopment = process.env.NODE_ENV === "development";
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


