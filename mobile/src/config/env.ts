import { z } from "zod";

const envSchema = z.object({
  // Native Google Sign-In (WEB OAuth client ID). The ID token minted by the
  // native SDK is verified server-side against GOOGLE_CLIENT_ID.
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().trim().optional(),
  // Android OAuth client (package name + SHA-1 registered in Google Cloud).
  // Android resolves it implicitly; kept here per app configuration.
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: z.string().trim().optional(),
  EXPO_PUBLIC_SERVER_URL: z
    .string()
    .trim()
    .url()
    .optional(),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
});

if (!parsed.success) {
  const messages = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${messages}`);
}

export const env = parsed.data;
