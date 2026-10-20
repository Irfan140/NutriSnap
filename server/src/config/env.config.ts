import { config as loadEnvFile } from "dotenv";
import { z } from "zod";

// Load the env-specific file first (.env.development / .env.production),
// then fall back to base .env for any missing keys. Neither call overrides
// real environment variables or values already loaded by the runtime
// (Bun auto-loads .env* files), so hosted secrets always win over files.
loadEnvFile({ path: `.env.${process.env.NODE_ENV ?? "development"}` });
loadEnvFile();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  OPENAI_API_KEY: z.string().trim().min(1, "OPENAI_API_KEY is required"),
  OPENAI_VISION_MODEL: z.string().trim().min(1).default("gpt-4o-mini"),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.3),
  AI_MODEL_PROVIDER: z.string().trim().min(1).default("openai"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  // Better Auth secrets must be high-entropy; Better Auth itself requires
  // at least 32 characters for its signing/encryption key material.
  BETTER_AUTH_SECRET: z
    .string()
    .trim()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  // Public origin of the API (e.g. https://nutrisnap-server.irfan.bond);
  // falls back to http://localhost:<PORT> when unset.
  BETTER_AUTH_URL: z.string().trim().url().optional(),
  // Google OAuth "Web application" client. Optional so the server still
  // boots for CI/smoke without them; auth sign-in routes error until set.
  GOOGLE_CLIENT_ID: z.string().trim().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().trim().min(1).optional(),
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().trim().min(1).default("redis://localhost:6379"),
  R2_ACCOUNT_ID: z.string().trim().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().trim().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().trim().min(1).optional(),
  R2_BUCKET: z.string().trim().min(1).optional(),
  R2_PRESIGN_PUT_TTL_SEC: z.coerce.number().int().positive().default(300),
  R2_PRESIGN_GET_TTL_SEC: z.coerce.number().int().positive().default(900),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error("Invalid server environment configuration", { cause: parsedEnv.error.flatten() });
}

export const env = parsedEnv.data;
