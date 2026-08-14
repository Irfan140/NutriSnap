import { Router } from "express";
import { aiService } from "../ai/service.js";
import { createAiController } from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/async.middleware.js";
import { analyzeMealRateLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();
const aiController = createAiController(aiService);

router.post("/aifood", requireAuth, analyzeMealRateLimiter, asyncHandler(aiController.analyzeMeal));

export default router;

