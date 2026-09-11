import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env.js";

export function createMealAnalysisModel(): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_VISION_MODEL,
    temperature: env.AI_TEMPERATURE,
    timeout: 30_000,
  });
}
