import { Router } from "express";
import { asyncHandler } from "../middlewares/async.middlewares.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { analyzeMealRateLimiter } from "../middlewares/rate-limit.middlewares.js";
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
router.get("/aifood/:id", requireAuth, asyncHandler(aiController.getAnalysis));

export default router;
