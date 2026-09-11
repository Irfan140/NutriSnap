import type { MealAnalysis, Prisma, User } from "../../generated/prisma/client.js";
import type { FoodAnalysis } from "./nutrition.types.js";

export type { FoodAnalysis } from "./nutrition.types.js";

export type AnalyzeMealResponse = {
  readonly message: string;
};

export type MealAnalysisJobData = {
  readonly analysisId: string;
  readonly r2Key: string;
};

export type SucceededAnalysisInput = {
  readonly nutrition: Prisma.InputJsonValue;
  readonly healthScore: number;
  readonly healthAdvice: readonly string[];
  readonly alternativeSuggestions: readonly string[];
  readonly summary: string;
  readonly message: string;
  readonly model: string;
  readonly durationMs: number;
};

export type MealAnalysisOutcome =
  | { readonly status: "success"; readonly analysis: FoodAnalysis; readonly message: string }
  | { readonly status: "invalid-image" | "not-food" | "invalid-ai-response" | "provider-failure" };

export type AiService = {
  readonly analyzeMeal: (image: string) => Promise<MealAnalysisOutcome>;
};

export type MealAnalysisDeps = {
  readonly ensureUser: (clerkId: string) => Promise<User>;
  readonly createQueuedAnalysis: (
    userId: string,
    r2Key: string,
    model: string,
  ) => Promise<MealAnalysis>;
  readonly findUserAnalysis: (id: string, userId: string) => Promise<MealAnalysis | null>;
  readonly enqueueMealAnalysis: (data: MealAnalysisJobData) => Promise<string>;
};
