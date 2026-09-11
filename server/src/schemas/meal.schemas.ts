import { z } from "zod";

export const enqueueMealAnalysisSchema = z.object({
  imageKey: z
    .string({ error: "No image key provided" })
    .trim()
    .min(1, "No image key provided")
    .max(512, "Image key is too long"),
});

export const mealAnalysisParamsSchema = z.object({
  id: z.string().trim().min(1, "No analysis id provided").max(128),
});

export const listMealsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type EnqueueMealAnalysisBody = z.infer<typeof enqueueMealAnalysisSchema>;
