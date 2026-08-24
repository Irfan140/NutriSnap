import { ChatGroq } from "@langchain/groq";
import { env } from "../config/env.js";

export function createMealAnalysisModel(): ChatGroq {
  return new ChatGroq({
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_VISION_MODEL,
    temperature: env.AI_TEMPERATURE,
    timeout: 30_000,
  });
}
