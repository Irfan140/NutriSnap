import "dotenv/config";
import { z } from "zod";
import { ConfigurationError } from "../errors/domain-errors.js";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  GROQ_API_KEY: z.string().trim().min(1, "GROQ_API_KEY is required"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new ConfigurationError("Invalid server environment configuration", parsedEnv.error.flatten());
}

export const env = parsedEnv.data;

