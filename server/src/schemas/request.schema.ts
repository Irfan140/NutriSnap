import { z } from "zod";
import { detectImageMimeType, isBase64Image, isImageTooLarge, stripImageDataUri } from "../utils/image.js";

export const analyzeMealRequestSchema = z.object({
  image: z
    .string({
      error: (issue) => (issue.input === undefined ? "No image provided" : "Image must be a base64 string"),
    })
    .trim()
    .min(1, "No image provided")
    .refine(isBase64Image, "Image must be valid base64")
    .refine((image) => !isImageTooLarge(image), "Image is too large. Please upload a smaller image.")
    .refine(
      (image) => detectImageMimeType(stripImageDataUri(image)) !== null,
      "Image must be a JPEG, PNG, WebP, or GIF.",
    ),
});

export type AnalyzeMealRequestBody = z.infer<typeof analyzeMealRequestSchema>;
