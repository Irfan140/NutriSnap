import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  GROQ_API_KEY: z.string().trim().min(1, "GROQ_API_KEY is required"),
  GROQ_VISION_MODEL: z.string().trim().min(1).default("qwen/qwen3.6-27b"),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.3),
  AI_MODEL_PROVIDER: z.string().trim().min(1).default("groq"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLERK_SECRET_KEY: z.string().trim().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_PUBLISHABLE_KEY: z.string().trim().min(1, "CLERK_PUBLISHABLE_KEY is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error("Invalid server environment configuration", { cause: parsedEnv.error.flatten() });
}

export const env = parsedEnv.data;

