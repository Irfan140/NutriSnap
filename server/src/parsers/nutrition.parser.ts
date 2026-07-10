import { AIResponseError } from "../errors/domain-errors.js";
import { nutritionAnalysisSchema } from "../schemas/nutrition.schema.js";
import type { NutritionAnalysis, NutritionBreakdown } from "../types/nutrition.js";

export function parseNutritionAnalysis(value: unknown): NutritionAnalysis {
  const result = nutritionAnalysisSchema.safeParse(value);

  if (!result.success) {
    throw new AIResponseError(undefined, result.error.flatten());
  }

  return result.data;
}

export function assertFoodAnalysis(analysis: NutritionAnalysis): asserts analysis is NutritionAnalysis & { nutrition: NutritionBreakdown } {
  if (!analysis.isFood || analysis.nutrition === null) {
    throw new AIResponseError("The image does not appear to contain food. Please upload a meal image.");
  }
}

export function formatNutritionMessage(analysis: NutritionAnalysis & { nutrition: NutritionBreakdown }): string {
  const nutritionJson = JSON.stringify(analysis.nutrition, null, 2);
  const advice = toMarkdownList(analysis.healthAdvice);
  const alternatives = toMarkdownList(analysis.alternativeSuggestions);

  return [
    "```json",
    nutritionJson,
    "```",
    "",
    "## Health Advice",
    advice,
    "",
    "## Alternative Suggestions",
    alternatives,
    "",
    "## Summary",
    analysis.summary,
  ].join("\n");
}

function toMarkdownList(items: readonly string[]): string {
  if (items.length === 0) {
    return "- No specific guidance available.";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

