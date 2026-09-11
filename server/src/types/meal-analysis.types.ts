import type {
  MealAnalysis,
  MealAnalysisStatus,
  Prisma,
  User,
} from "../../generated/prisma/client.js";
import type { FoodAnalysis } from "./nutrition.types.js";

export type { FoodAnalysis } from "./nutrition.types.js";

export type AnalyzeMealResponse = {
  readonly message: string;
};

export type MealAnalysisJobData = {
  readonly analysisId: string;
  readonly r2Key: string;
};

/** Payload for maintenance (sweep) jobs, which carry no data. */
export type MaintenanceJobData = Record<string, never>;

/** Any job that can sit on the meal-analysis queue. */
export type MealQueueJobData = MealAnalysisJobData | MaintenanceJobData;

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

export type MealHistoryItem = {
  readonly id: string;
  readonly status: MealAnalysisStatus;
  readonly healthScore: number | null;
  readonly summary: string | null;
  readonly error: string | null;
  readonly r2Key: string;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
};

export type MealHistoryPage = {
  readonly items: readonly MealHistoryItem[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
};

export type UserMealStats = {
  readonly total: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly averageHealthScore: number | null;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly lastAnalyzedAt: Date | null;
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
  readonly listUserAnalyses: (
    userId: string,
    page: number,
    limit: number,
  ) => Promise<{ items: MealHistoryItem[]; total: number }>;
  readonly getUserMealStats: (userId: string) => Promise<UserMealStats>;
  readonly removeAnalysisJob: (analysisId: string) => Promise<boolean>;
  readonly deleteAnalysisById: (id: string) => Promise<void>;
  readonly deleteObject: (key: string) => Promise<void>;
  readonly enqueueMealAnalysis: (data: MealAnalysisJobData) => Promise<string>;
};
