import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { HTTP_STATUS } from "../constants/http.js";
import type { AiService } from "../services/ai.service.js";
import type { AnalyzeMealRequestBody } from "../schemas/request.schema.js";
import type { AnalyzeMealResponse } from "../types/nutrition.js";

type AnalyzeMealHandler = RequestHandler<ParamsDictionary, AnalyzeMealResponse, AnalyzeMealRequestBody>;

export function createAiController(service: AiService) {
  const analyzeMeal: AnalyzeMealHandler = async (req, res): Promise<void> => {
    const result = await service.analyzeMeal(req.body.image);
    res.status(HTTP_STATUS.OK).json(result);
  };

  return { analyzeMeal };
}
