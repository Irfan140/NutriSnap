import { nutritionPrompt } from "../prompts/nutrition.prompt.js";
import { nutritionAnalysisSchema } from "../schemas/nutrition.schema.js";
import { assertFoodAnalysis, formatNutritionMessage, parseNutritionAnalysis } from "../parsers/nutrition.parser.js";
import { createMealAnalysisModel } from "../config/ai.js";
import { toImageDataUri } from "../utils/image.js";
import { logger } from "../utils/logger.js";
import type { AnalyzeMealResponse } from "../types/nutrition.js";

export type AiService = {
  readonly analyzeMeal: (image: string) => Promise<AnalyzeMealResponse>;
};

export function createAiService(): AiService {
  const model = createMealAnalysisModel();
  const structuredModel = model.withStructuredOutput(nutritionAnalysisSchema, {
    method: "jsonMode",
  });
  const chain = nutritionPrompt.pipe(structuredModel);

  async function analyzeMeal(image: string): Promise<AnalyzeMealResponse> {
    const startedAt = performance.now();
    const imageDataUri = toImageDataUri(image);

    const rawAnalysis = await chain.invoke({ imageDataUri });
    const analysis = parseNutritionAnalysis(rawAnalysis);
    assertFoodAnalysis(analysis);

    logger.info("AI meal analysis completed", {
      durationMs: Math.round(performance.now() - startedAt),
      provider: "groq",
    });

    return {
      message: formatNutritionMessage(analysis),
    };
  }

  return { analyzeMeal };
}

export const aiService = createAiService();
