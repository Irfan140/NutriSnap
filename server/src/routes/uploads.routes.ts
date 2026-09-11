import { Router } from "express";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { uploadPresignRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { createAiController } from "./ai.controller.js";

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
