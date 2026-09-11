import { clerkClient } from "@clerk/express";
import { z } from "zod";
import type { User } from "../../generated/prisma/client.js";
import {
  deleteUserByClerkId,
  findUserByClerkId,
  upsertUserByClerkId,
  type UpsertUserInput,
} from "../repositories/users.repositories.js";
import { logger } from "../utils/logger.utils.js";

const clerkUserDataSchema = z.object({
  id: z.string().min(1),
  email_addresses: z.array(z.object({ email_address: z.string() })).optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
});

export const clerkWebhookEventSchema = z.object({
  type: z.enum(["user.created", "user.updated", "user.deleted"]),
  data: clerkUserDataSchema,
});

export type ClerkWebhookEvent = z.infer<typeof clerkWebhookEventSchema>;

export function toUpsertInput(data: z.infer<typeof clerkUserDataSchema>): UpsertUserInput {
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  return {
    clerkId: data.id,
    email: data.email_addresses?.[0]?.email_address,
    name: name === "" ? undefined : name,
    imageUrl: data.image_url ?? undefined,
  };
}

export async function syncClerkUser(input: UpsertUserInput): Promise<User> {
  return upsertUserByClerkId(input);
}

export async function removeClerkUser(clerkId: string): Promise<void> {
  await deleteUserByClerkId(clerkId);
}

/**
 * Backstop for missed/failed webhook deliveries: ensures a local user row
 * exists for an authenticated Clerk id, fetching profile data from the
 * Clerk API only when the row is missing.
 */
export async function ensureUser(clerkId: string): Promise<User> {
  const existing = await findUserByClerkId(clerkId);
  if (existing) {
    return existing;
  }

  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");
    return await upsertUserByClerkId({
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      name: name === "" ? undefined : name,
      imageUrl: clerkUser.imageUrl ?? undefined,
    });
  } catch (error) {
    logger.error({ err: error, clerkId }, "Failed to fetch Clerk user for lazy ensure");
    // Last resort so FK constraints hold; the webhook enriches the row later.
    return upsertUserByClerkId({ clerkId });
  }
}
