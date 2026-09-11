import { Router } from "express";
import { asyncHandler } from "../middlewares/async.middlewares.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import {
  analyzeMealRateLimiter,
  listMealsRateLimiter,
} from "../middlewares/rate-limit.middlewares.js";
import { createAiController } from "../controllers/meal-analysis.controllers.js";

const router = Router();
const aiController = createAiController();

// Async analysis: enqueue a background job (202) and poll GET /api/aifood/:id.
router.post(
  "/aifood",
  requireAuth,
  analyzeMealRateLimiter,
  asyncHandler(aiController.enqueueAnalysis),
);
// Newest-first meal history page. Declared before "/aifood/:id" for clarity
// (exact paths never collide with Express params, but order aids reading).
router.get("/aifood", requireAuth, listMealsRateLimiter, asyncHandler(aiController.listAnalyses));
// Must precede "/aifood/:id" — otherwise "stats" would match the :id param.
router.get(
  "/aifood/stats",
  requireAuth,
  listMealsRateLimiter,
  asyncHandler(aiController.getMealsStats),
);
router.get("/aifood/:id", requireAuth, asyncHandler(aiController.getAnalysis));

export default router;
