import { ChatGroq } from "@langchain/groq";
import { AI_TEMPERATURE, GROQ_VISION_MODEL } from "../constants/ai.js";
import { env } from "./env.js";

export function createMealAnalysisModel(): ChatGroq {
  return new ChatGroq({
    apiKey: env.GROQ_API_KEY,
    model: GROQ_VISION_MODEL,
    temperature: AI_TEMPERATURE,
  });
}

