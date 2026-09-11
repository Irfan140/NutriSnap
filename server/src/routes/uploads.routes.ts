import { Router } from "express";
import { asyncHandler } from "../middlewares/async.middlewares.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { uploadPresignRateLimiter } from "../middlewares/rate-limit.middlewares.js";
import { createAiController } from "../controllers/meal-analysis.controllers.js";

const router = Router();
const aiController = createAiController();

// Issues a short-lived presigned PUT URL for direct-to-R2 uploads.
router.post(
  "/uploads/presign",
  requireAuth,
  uploadPresignRateLimiter,
  asyncHandler(aiController.requestUpload),
);

export default router;
