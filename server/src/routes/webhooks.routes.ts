import { Router } from "express";
import { Webhook } from "svix";
import { env } from "../config/env.js";
import {
  clerkWebhookEventSchema,
  removeClerkUser,
  syncClerkUser,
  toUpsertInput,
} from "../services/clerk-sync.service.js";
import { logger } from "../utils/logger.js";

const router = Router();

/**
 * Clerk Svix webhooks (user.created / user.updated / user.deleted).
 * Mounted with `express.raw({ type: "application/json" })` in app.ts —
 * signature verification requires the exact raw bytes, so this route must
 * run before the global JSON body parser. `req.body` is a Buffer here.
 */
router.post("/clerk", (req, res): void => {
  if (!env.CLERK_WEBHOOK_SECRET) {
    logger.error("Clerk webhook received but CLERK_WEBHOOK_SECRET is not configured");
    res.status(500).json({ error: "Clerk webhook is not configured." });
    return;
  }

  const svixId = req.header("svix-id");
  const svixTimestamp = req.header("svix-timestamp");
  const svixSignature = req.header("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing Svix signature headers." });
    return;
  }

  let event: unknown;
  try {
    const payload = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : JSON.stringify(req.body);
    event = new Webhook(env.CLERK_WEBHOOK_SECRET).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    res.status(400).json({ error: "Invalid webhook signature." });
    return;
  }

  const parsed = clerkWebhookEventSchema.safeParse(event);
  if (!parsed.success) {
    res.status(400).json({ error: "Unsupported webhook event." });
    return;
  }

  const { type, data } = parsed.data;
  syncClerkUserForEvent(type, data.id, data)
    .then(() => {
      res.status(200).json({ received: true });
    })
    .catch((error: unknown) => {
      logger.error({ err: error, type }, "Failed to process Clerk webhook");
      res.status(500).json({ error: "Failed to process webhook." });
    });
});

async function syncClerkUserForEvent(
  type: "user.created" | "user.updated" | "user.deleted",
  clerkId: string,
  data: Parameters<typeof toUpsertInput>[0],
): Promise<void> {
  if (type === "user.deleted") {
    // Cascades to the user's meal analyses (see Prisma schema).
    await removeClerkUser(clerkId);
    return;
  }
  await syncClerkUser(toUpsertInput(data));
}

export default router;
