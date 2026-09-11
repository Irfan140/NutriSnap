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

/**
 * Extracts and parses a JSON object from raw LLM text output.
 * Handles markdown code fences, stray whitespace, and common LLM quirks.
 */
export function parseNutritionText(text: string): NutritionAnalysis | null {
  const cleaned = text.trim();

  // Strategy 1: raw JSON from the cleaned text
  let json = tryExtractJson(cleaned);
  if (json !== null) {
    const result = nutritionAnalysisSchema.safeParse(json);
    if (result.success) return result.data;
  }

  // Strategy 2: ```json ... ``` code fence
  json = extractFencedJson(cleaned, "json");
  if (json !== null) {
    const result = nutritionAnalysisSchema.safeParse(json);
    if (result.success) return result.data;
  }

  // Strategy 3: ``` ... ``` any code fence
  json = extractFencedJson(cleaned, null);
  if (json !== null) {
    const result = nutritionAnalysisSchema.safeParse(json);
    if (result.success) return result.data;
  }

  return null;
}

function tryExtractJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    // Try to find the first { and last } and parse that slice
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function extractFencedJson(text: string, language: string | null): unknown | null {
  const openingTag = language ? "```" + language : "```";
  const startIdx = text.indexOf(openingTag);
  if (startIdx === -1) return null;

  const contentStart = text.indexOf("\n", startIdx);
  if (contentStart === -1) return null;

  const endIdx = text.indexOf("```", contentStart);
  if (endIdx === -1) return null;

  const inner = text.slice(contentStart + 1, endIdx).trim();
  return tryExtractJson(inner);
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
