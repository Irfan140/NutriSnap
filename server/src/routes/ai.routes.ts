import { Router } from "express";
import { aiService } from "../ai/service.js";
import { createAiController } from "../controllers/ai.controller.js";
import { asyncHandler } from "../middleware/async.middleware.js";

const router = Router();
const aiController = createAiController(aiService);

router.post("/aifood", asyncHandler(aiController.analyzeMeal));

export default router;

