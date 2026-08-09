import { nutritionAnalysisSchema } from "./schemas.js";
import type { NutritionAnalysis, NutritionBreakdown } from "./schemas.js";

export type FoodAnalysis = NutritionAnalysis & { nutrition: NutritionBreakdown };

export function parseNutritionAnalysis(value: unknown): NutritionAnalysis | null {
  const result = nutritionAnalysisSchema.safeParse(value);

  if (!result.success) {
    return null;
  }

  return result.data;
}

export function isFoodAnalysis(analysis: NutritionAnalysis): analysis is FoodAnalysis {
  return analysis.isFood && analysis.nutrition !== null;
}

export function formatNutritionMessage(analysis: FoodAnalysis): string {
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
