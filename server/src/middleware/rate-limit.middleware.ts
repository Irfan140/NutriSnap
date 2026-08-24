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
      error:
        "Rate limit hit — the developer is currently unemployed and cannot afford paid models. " +
        "Pray he gets a job by the end of the year so this doesn't happen again.",
    });
  },
});
