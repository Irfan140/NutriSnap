import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { AiService } from "../ai/service.js";
import { analyzeMealRequestSchema } from "../schemas/request.schema.js";
import type { AnalyzeMealResponse } from "../types/nutrition.js";

type ErrorResponse = {
  readonly error: string;
};

type AnalyzeMealResponseBody = AnalyzeMealResponse | ErrorResponse;

type AnalyzeMealHandler = RequestHandler<ParamsDictionary, AnalyzeMealResponseBody>;

export function createAiController(service: AiService) {
  const analyzeMeal: AnalyzeMealHandler = async (req, res): Promise<void> => {
    const parsedBody = analyzeMealRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.issues[0]?.message ?? "Invalid request body" });
      return;
    }

    const outcome = await service.analyzeMeal(parsedBody.data.image);

    if (outcome.status === "success") {
      res.status(200).json({ message: outcome.message });
      return;
    }

    if (outcome.status === "invalid-image") {
      res.status(422).json({ error: "Invalid image payload. Provide a base64 encoded image." });
      return;
    }

    if (outcome.status === "not-food") {
      res.status(422).json({ error: "The image does not appear to contain food. Please upload a meal image." });
      return;
    }

    if (outcome.status === "invalid-ai-response") {
      res.status(422).json({ error: "AI returned invalid nutrition data. Please try again with a clearer food image." });
      return;
    }

    res.status(500).json({ error: "Error fetching AI guidance" });
  };

  return { analyzeMeal };
}
