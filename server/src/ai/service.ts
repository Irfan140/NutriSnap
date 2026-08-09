import { env } from "../config/env.js";
import { createMealAnalysisModel } from "./model.js";
import { formatNutritionMessage, isFoodAnalysis, parseNutritionAnalysis } from "./parsers.js";
import { nutritionPrompt } from "./prompts.js";
import { nutritionAnalysisSchema } from "./schemas.js";
import { toImageDataUri } from "../utils/image.js";
import { logger } from "../utils/logger.js";

export type MealAnalysisOutcome =
  | { readonly status: "success"; readonly message: string }
  | { readonly status: "invalid-image" | "not-food" | "invalid-ai-response" | "provider-failure" };

export type AiService = {
  readonly analyzeMeal: (image: string) => Promise<MealAnalysisOutcome>;
};

export function createAiService(): AiService {
  const model = createMealAnalysisModel();
  const structuredModel = model.withStructuredOutput(nutritionAnalysisSchema, {
    method: "jsonMode",
  });
  const chain = nutritionPrompt.pipe(structuredModel);

  async function analyzeMeal(image: string): Promise<MealAnalysisOutcome> {
    const startedAt = performance.now();
    const imageDataUri = toImageDataUri(image);

    if (imageDataUri === null) {
      return { status: "invalid-image" };
    }

    let rawAnalysis: unknown;

    try {
      rawAnalysis = await chain.invoke({ imageDataUri });
    } catch (error) {
      logger.error("AI meal analysis request failed", { error });
      return { status: "provider-failure" };
    }

    const analysis = parseNutritionAnalysis(rawAnalysis);

    if (analysis === null) {
      return { status: "invalid-ai-response" };
    }

    if (!isFoodAnalysis(analysis)) {
      return { status: "not-food" };
    }

    logger.info("AI meal analysis completed", {
      durationMs: Math.round(performance.now() - startedAt),
      provider: env.AI_MODEL_PROVIDER,
    });

    return {
      status: "success",
      message: formatNutritionMessage(analysis),
    };
  }

  return { analyzeMeal };
}

export const aiService = createAiService();
