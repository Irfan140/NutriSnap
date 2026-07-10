import type { z } from "zod";
import type { nutritionAnalysisSchema, nutritionBreakdownSchema } from "../schemas/nutrition.schema.js";

export type NutritionBreakdown = z.infer<typeof nutritionBreakdownSchema>;

export type NutritionAnalysis = z.infer<typeof nutritionAnalysisSchema>;

export type AnalyzeMealResponse = {
  readonly message: string;
};

