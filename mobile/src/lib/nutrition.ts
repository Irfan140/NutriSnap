import { z } from "zod";

export const analyzeResponseSchema = z.object({
  message: z.string().min(1),
});

export const apiErrorSchema = z.object({
  error: z.string().min(1).default("Error analyzing image"),
});

export const nutritionDataSchema = z.object({
  calories: z.coerce.number().finite().nonnegative().default(0),
  protein: z.coerce.number().finite().nonnegative().default(0),
  carbohydrates: z.coerce.number().finite().nonnegative().default(0),
  fat: z.coerce.number().finite().nonnegative().default(0),
  fiber: z.coerce.number().finite().nonnegative().default(0),
  healthScore: z.coerce.number().finite().min(0).max(100).default(0),
  explanation: z.string().default(""),
  vitamins: z.array(z.string()).default([]),
});

export type NutritionData = z.infer<typeof nutritionDataSchema>;

function pickValue(data: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (data[key] !== undefined) {
      return data[key];
    }
  }
  return undefined;
}

function parseVitamins(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value as Record<string, unknown>).map(
      ([name, amount]) => `${name}: ${String(amount)}`,
    );
  }

  return [];
}

export function parseNutritionData(raw: unknown): NutritionData | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const data = raw as Record<string, unknown>;

  const result = nutritionDataSchema.safeParse({
    calories: pickValue(data, "Calories (kcal)", "Calories"),
    protein: pickValue(data, "Protein (g)", "Protein"),
    carbohydrates: pickValue(data, "Carbohydrates (g)", "Carbohydrates"),
    fat: pickValue(data, "Fat (g)", "Fat"),
    fiber: pickValue(data, "Fiber (g)", "Fiber"),
    healthScore: pickValue(data, "Health Score"),
    explanation: pickValue(data, "Health Score Explanation", "Explanation"),
    vitamins: parseVitamins(data["Key vitamins & minerals"]),
  });

  return result.success ? result.data : null;
}

export function extractJsonBlock(message: string): unknown | null {
  const match = message.match(/```json([\s\S]*?)```/);

  if (!match || match[1] === undefined) {
    return null;
  }

  const cleaned = match[1].trim().replace(/\/\/.*$/gm, "");

  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    return null;
  }
}

export function hasJsonBlock(message: string): boolean {
  return /```json[\s\S]*?```/.test(message);
}

export function extractMarkdown(message: string): string {
  return message
    .replace(/```json[\s\S]*?```/, "")
    .replace(/^### 1\..*$/m, "")
    .replace(/^### 2\..*$/m, "")
    .trim();
}
