import { Router } from "express";
import { asyncHandler } from "../middlewares/async.middlewares.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { accountDeleteRateLimiter } from "../middlewares/rate-limit.middlewares.js";
import { createAccountController } from "../controllers/account.controllers.js";

const router = Router();
const accountController = createAccountController();

// Self-serve full erasure (jobs + R2 objects + rows + Clerk user).
router.delete(
  "/account",
  requireAuth,
  accountDeleteRateLimiter,
  asyncHandler(accountController.deleteAccount),
);

export default router;
