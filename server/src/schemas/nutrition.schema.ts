import { z } from "zod";

const nutritionNumberSchema = z.number().finite().nonnegative();

export const nutritionBreakdownSchema = z.object({
  "Calories (kcal)": nutritionNumberSchema,
  "Protein (g)": nutritionNumberSchema,
  "Carbohydrates (g)": nutritionNumberSchema,
  "Fat (g)": nutritionNumberSchema,
  "Fiber (g)": nutritionNumberSchema,
  "Key vitamins & minerals": z.array(z.string().trim().min(1)).min(1),
  "Health Score": z.number().int().min(0).max(100),
  "Health Score Explanation": z.string().trim().min(1),
});

export const nutritionAnalysisSchema = z.object({
  isFood: z.boolean(),
  nutrition: nutritionBreakdownSchema.nullable(),
  healthAdvice: z.array(z.string().trim().min(1)).default([]),
  alternativeSuggestions: z.array(z.string().trim().min(1)).default([]),
  summary: z.string().trim().default(""),
});

