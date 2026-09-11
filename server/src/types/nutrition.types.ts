import type { NutritionAnalysis, NutritionBreakdown } from "../schemas/nutrition.schemas.js";

/** A validated food analysis with a guaranteed non-null nutrition block. */
export type FoodAnalysis = NutritionAnalysis & { nutrition: NutritionBreakdown };
