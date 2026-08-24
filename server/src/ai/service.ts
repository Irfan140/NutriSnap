import { env } from "../config/env.js";
import { createMealAnalysisModel } from "./model.js";
import { formatNutritionMessage, isFoodAnalysis, parseNutritionText } from "./parsers.js";
import { nutritionPrompt } from "./prompts.js";
import { toImageDataUri } from "../utils/image.js";
import { logger } from "../utils/logger.js";

export type MealAnalysisOutcome =
  | { readonly status: "success"; readonly message: string }
  | { readonly status: "invalid-image" | "not-food" | "invalid-ai-response" | "provider-failure" };

export type AiService = {
  readonly analyzeMeal: (image: string) => Promise<MealAnalysisOutcome>;
};

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
   * Groq free tier has 8,000 TPM / 30 RPM for qwen/qwen3.6-27b,
   * and a single vision request can consume 3,000-6,000 input tokens.
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
            "Groq rate-limited, retrying…",
          );
          await sleep(delay);
          continue;
        }

        if (attempt < MAX_RETRIES - 1) {
          const delay = BASE_DELAY_MS * 2 ** attempt;
          logger.warn(
            { attempt: attempt + 1, delayMs: delay, err: String(error) },
            "Groq request failed, retrying…",
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
      logger.warn(
        { preview: rawText.slice(0, 300) },
        "AI returned unparseable response",
      );
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
      message: formatNutritionMessage(analysis),
    };
  }

  return { analyzeMeal };
}

export const aiService = createAiService();
