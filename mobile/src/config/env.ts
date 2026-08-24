import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .trim()
    .min(1, "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  EXPO_PUBLIC_SERVER_URL: z
    .string()
    .trim()
    .url()
    .optional(),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
});

if (!parsed.success) {
  const messages = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${messages}`);
}

export const env = parsed.data;