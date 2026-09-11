import type { User } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.lib.js";
import type { UpsertUserInput } from "../types/user.types.js";

export async function findUserByClerkId(clerkId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { clerkId } });
}

export async function upsertUserByClerkId(input: UpsertUserInput): Promise<User> {
  return prisma.user.upsert({
    where: { clerkId: input.clerkId },
    create: {
      clerkId: input.clerkId,
      email: input.email,
      name: input.name,
      imageUrl: input.imageUrl,
    },
    update: {
      email: input.email,
      name: input.name,
      imageUrl: input.imageUrl,
    },
  });
}

export async function deleteUserByClerkId(clerkId: string): Promise<void> {
  await prisma.user.deleteMany({ where: { clerkId } });
}
