import { ChatPromptTemplate } from "@langchain/core/prompts";
import { env } from "../config/env.config.js";
import { createMealAnalysisModel } from "../lib/openai.lib.js";
import { nutritionAnalysisSchema } from "../schemas/nutrition.schemas.js";
import type { NutritionAnalysis, NutritionBreakdown } from "../schemas/nutrition.schemas.js";
import { toImageDataUri } from "../utils/image.utils.js";
import { logger } from "../utils/logger.utils.js";

export type FoodAnalysis = NutritionAnalysis & { nutrition: NutritionBreakdown };

export type MealAnalysisOutcome =
  | { readonly status: "success"; readonly analysis: FoodAnalysis; readonly message: string }
  | { readonly status: "invalid-image" | "not-food" | "invalid-ai-response" | "provider-failure" };

export type AiService = {
  readonly analyzeMeal: (image: string) => Promise<MealAnalysisOutcome>;
};

// ── Prompt ───────────────────────────────────────────────────────────

const nutritionPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a professional nutritionist AI analyzing meal images.

Return only one valid JSON object. Do NOT include any thinking, reasoning, explanation, markdown, code fences, tool calls, or quoted JSON strings — ONLY the raw JSON object on a single line.
If the image does not clearly contain food or a meal, set isFood to false and nutrition to null.

For food images:
- Estimate nutrition from visible ingredients and portion size.
- Keep values realistic and numeric.
- Use real JSON types: isFood must be a boolean, nutrition must be an object or null, and numbers must not be strings.
- Include concise, practical health advice.
- Suggest healthier alternatives that preserve the meal's flavor profile when possible.
- Do not include medical diagnosis or unsafe certainty.

Required JSON shape:
{{
  "isFood": true,
  "nutrition": {{
    "Calories (kcal)": 0,
    "Protein (g)": 0,
    "Carbohydrates (g)": 0,
    "Fat (g)": 0,
    "Fiber (g)": 0,
    "Key vitamins & minerals": ["string"],
    "Health Score": 0,
    "Health Score Explanation": "string"
  }},
  "healthAdvice": ["string"],
  "alternativeSuggestions": ["string"],
  "summary": "string"
}}`,
  ],
  [
    "human",
    [
      {
        type: "text",
        text: "Analyze this image and return the structured meal nutrition result.",
      },
      {
        type: "image_url",
        image_url: {
          url: "{imageDataUri}",
        },
      },
    ],
  ],
]);

// ── Response parsing ─────────────────────────────────────────────────

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

// ── Retry helpers ──────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("429") ||
      error.message.includes("rate_limit") ||
      error.message.includes("Rate limit")
    );
  }
  return false;
}

function extractRetryAfter(error: unknown): number {
  if (error instanceof Error) {
    const match = error.message.match(/retry[-_]after[:\s]+(\d+)/i);
    if (match?.[1]) return parseInt(match[1], 10);
  }
  return 0;
}

// ── Service ────────────────────────────────────────────────────────

export function createAiService(): AiService {
  const model = createMealAnalysisModel();
  const chain = nutritionPrompt.pipe(model);

  /**
   * Invokes the model with exponential backoff on rate-limit errors.
   * Retries transient 429/5xx failures from the OpenAI API;
   * a single vision request can consume several thousand input tokens.
   */
  async function invokeWithRetry(imageDataUri: string): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await chain.invoke({ imageDataUri });
        const content = response.content;
        let text: string;
        if (typeof content === "string") {
          text = content;
        } else if (Array.isArray(content)) {
          text = content
            .map((c) => {
              if (typeof c === "string") return c;
              if (c && typeof c === "object" && "text" in c) {
                return String((c as { text: unknown }).text ?? "");
              }
              return "";
            })
            .join("");
        } else {
          text = String(content);
        }
        return text;
      } catch (error) {
        lastError = error;

        if (isRateLimitError(error)) {
          const retryAfter = extractRetryAfter(error);
          const delay = retryAfter > 0 ? retryAfter * 1_000 : BASE_DELAY_MS * 2 ** attempt;
          logger.warn(
            { attempt: attempt + 1, delayMs: delay, err: String(error) },
            "OpenAI rate-limited, retrying…",
          );
          await sleep(delay);
          continue;
        }

        if (attempt < MAX_RETRIES - 1) {
          const delay = BASE_DELAY_MS * 2 ** attempt;
          logger.warn(
            { attempt: attempt + 1, delayMs: delay, err: String(error) },
            "OpenAI request failed, retrying…",
          );
          await sleep(delay);
          continue;
        }
      }
    }

    throw lastError;
  }

  async function analyzeMeal(image: string): Promise<MealAnalysisOutcome> {
    const startedAt = performance.now();
    const imageDataUri = toImageDataUri(image);

    if (imageDataUri === null) {
      return { status: "invalid-image" };
    }

    let rawText: string;

    try {
      rawText = await invokeWithRetry(imageDataUri);
    } catch (error) {
      logger.error({ err: error }, "AI meal analysis failed after all retries");
      return { status: "provider-failure" };
    }

    const analysis = parseNutritionText(rawText);

    if (analysis === null) {
      logger.warn({ preview: rawText.slice(0, 300) }, "AI returned unparseable response");
      return { status: "invalid-ai-response" };
    }

    if (!isFoodAnalysis(analysis)) {
      return { status: "not-food" };
    }

    logger.info(
      {
        durationMs: Math.round(performance.now() - startedAt),
        provider: env.AI_MODEL_PROVIDER,
      },
      "AI meal analysis completed",
    );

    return {
      status: "success",
      analysis,
      message: formatNutritionMessage(analysis),
    };
  }

  return { analyzeMeal };
}

export const aiService = createAiService();
