import { prisma } from "../lib/prisma.lib.js";

/**
 * Deletes the Better Auth user row. FK `onDelete: Cascade` removes the
 * user's sessions, social accounts, and meal analyses along with it.
 */
export async function deleteUserById(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}
