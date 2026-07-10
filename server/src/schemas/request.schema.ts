import { z } from "zod";
import { isBase64Image } from "../utils/image.js";

export const analyzeMealRequestSchema = z.object({
  image: z
    .string({
      error: (issue) => (issue.input === undefined ? "No image provided" : "Image must be a base64 string"),
    })
    .trim()
    .min(1, "No image provided")
    .refine(isBase64Image, "Image must be valid base64"),
});

export type AnalyzeMealRequestBody = z.infer<typeof analyzeMealRequestSchema>;
