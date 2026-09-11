import { ipKeyGenerator, rateLimit } from "express-rate-limit";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 20;

/**
 * Rate limiter for the AI analysis endpoint. Requests are keyed by the
 * authenticated Clerk user id when available, falling back to the client IP
 * address otherwise.
 */
export const analyzeMealRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_REQUESTS,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.userId ?? (req.ip ? ipKeyGenerator(req.ip) : "unknown"),
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many analysis requests. Please try again in a while.",
    });
  },
});

/**
 * Lighter guard for presigned-URL issuance (no AI cost per call, but each
 * URL enables an R2 upload, so unbounded issuance is still abuse).
 */
export const uploadPresignRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.userId ?? (req.ip ? ipKeyGenerator(req.ip) : "unknown"),
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many upload requests. Please try again in a while.",
    });
  },
});

/**
 * Generous guard for cheap authenticated reads (meal history pages).
 */
export const listMealsRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.userId ?? (req.ip ? ipKeyGenerator(req.ip) : "unknown"),
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many requests. Please try again in a while.",
    });
  },
});

/**
 * Strict guard for irreversible account erasure.
 */
export const accountDeleteRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.userId ?? (req.ip ? ipKeyGenerator(req.ip) : "unknown"),
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many requests. Please try again in a while.",
    });
  },
});
