import { Router } from "express";
import { createAiController } from "../controllers/ai.controller.js";
import { analyzeMealRequestSchema } from "../schemas/request.schema.js";
import { aiService } from "../services/ai.service.js";
import { asyncHandler } from "../middleware/async.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

const router = Router();
const aiController = createAiController(aiService);

router.post("/aifood", validateBody(analyzeMealRequestSchema), asyncHandler(aiController.analyzeMeal));

export default router;

