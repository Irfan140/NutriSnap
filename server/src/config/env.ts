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
  CLERK_SECRET_KEY: z.string().trim().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_PUBLISHABLE_KEY: z.string().trim().min(1, "CLERK_PUBLISHABLE_KEY is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error("Invalid server environment configuration", { cause: parsedEnv.error.flatten() });
}

export const env = parsedEnv.data;

