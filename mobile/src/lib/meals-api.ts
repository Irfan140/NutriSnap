import { z } from "zod";

export const presignUploadResponseSchema = z.object({
  key: z.string().min(1),
  uploadUrl: z.string().url(),
  expiresInSec: z.number(),
});

export const enqueueAnalysisResponseSchema = z.object({
  analysisId: z.string().min(1),
  status: z.string().min(1),
});

export const analysisStatusResponseSchema = z.object({
  analysisId: z.string().min(1),
  status: z.string().min(1),
  message: z.string().optional(),
  error: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type PresignUploadResponse = z.infer<typeof presignUploadResponseSchema>;
export type EnqueueAnalysisResponse = z.infer<typeof enqueueAnalysisResponseSchema>;
export type AnalysisStatusResponse = z.infer<typeof analysisStatusResponseSchema>;

export const POLL_INTERVAL_MS = 2500;
export const POLL_TIMEOUT_MS = 4 * 60 * 1000;

export type AnalysisFinal =
  | { readonly outcome: "succeeded"; readonly payload: AnalysisStatusResponse }
  | { readonly outcome: "failed"; readonly payload: AnalysisStatusResponse };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Polls the analysis status endpoint until the job reaches a terminal state
 * (SUCCEEDED / FAILED) or the timeout elapses. Throws on transport errors,
 * unexpected payloads, or timeout — the caller maps these to user copy.
 */
export async function pollAnalysisUntilDone(
  statusUrl: string,
  getToken: () => Promise<string | null>,
  options?: { readonly intervalMs?: number; readonly timeoutMs?: number },
): Promise<AnalysisFinal> {
  const intervalMs = options?.intervalMs ?? POLL_INTERVAL_MS;
  const timeoutMs = options?.timeoutMs ?? POLL_TIMEOUT_MS;
  const startedAt = Date.now();

  for (;;) {
    const token = await getToken();
    if (!token) {
      throw new Error("AUTH_EXPIRED");
    }

    const res = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      throw new Error("AUTH_EXPIRED");
    }

    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      throw new Error(`Unexpected server response (${res.status}).`);
    }

    if (res.status === 404) {
      throw new Error("Analysis not found on the server.");
    }
    if (!res.ok && res.status !== 422) {
      throw new Error(`Analysis check failed (${res.status}).`);
    }

    const parsed = analysisStatusResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error("Unexpected server response.");
    }

    const status = parsed.data.status;
    if (status === "SUCCEEDED") {
      return { outcome: "succeeded", payload: parsed.data };
    }
    if (status === "FAILED") {
      return { outcome: "failed", payload: parsed.data };
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Analysis is taking too long. Please try again.");
    }
    await sleep(intervalMs);
  }
}

export const mealHistoryItemSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
  healthScore: z.number().int().min(0).max(100).nullable(),
  summary: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.string().min(1),
  completedAt: z.string().nullable(),
  imageUrl: z.string().optional(),
});

export const mealHistoryPageSchema = z.object({
  items: z.array(mealHistoryItemSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
});

export type MealHistoryItem = z.infer<typeof mealHistoryItemSchema>;
export type MealHistoryPage = z.infer<typeof mealHistoryPageSchema>;

export const MEALS_PAGE_LIMIT = 20;

/**
 * Fetches one newest-first page of the caller's meal history.
 * Throws `AUTH_EXPIRED` (caller signs out) or a user-facing Error.
 */
export async function fetchMealsPage(
  baseUrl: string,
  page: number,
  getToken: () => Promise<string | null>,
): Promise<MealHistoryPage> {
  const token = await getToken();
  if (!token) {
    throw new Error("AUTH_EXPIRED");
  }

  const res = await fetch(`${baseUrl}?page=${page}&limit=${MEALS_PAGE_LIMIT}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw new Error("AUTH_EXPIRED");
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new Error(`Unexpected server response (${res.status}).`);
  }

  if (!res.ok) {
    const err =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error?: unknown }).error
        : undefined;
    throw new Error(
      typeof err === "string" && err !== "" ? err : `History request failed (${res.status}).`,
    );
  }

  const parsed = mealHistoryPageSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Unexpected server response.");
  }
  return parsed.data;
}

export const mealStatsSchema = z.object({
  total: z.number().int().min(0),
  succeeded: z.number().int().min(0),
  failed: z.number().int().min(0),
  averageHealthScore: z.number().min(0).max(100).nullable(),
  currentStreak: z.number().int().min(0),
  bestStreak: z.number().int().min(0),
  lastAnalyzedAt: z.string().nullable(),
});

export type MealStats = z.infer<typeof mealStatsSchema>;

/**
 * Fetches the caller's aggregate meal stats for the Profile screen.
 * Throws `AUTH_EXPIRED` (caller signs out) or a user-facing Error.
 */
export async function fetchMealsStats(
  statsUrl: string,
  getToken: () => Promise<string | null>,
): Promise<MealStats> {
  const token = await getToken();
  if (!token) {
    throw new Error("AUTH_EXPIRED");
  }

  const res = await fetch(statsUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw new Error("AUTH_EXPIRED");
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new Error(`Unexpected server response (${res.status}).`);
  }

  if (!res.ok) {
    const err =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error?: unknown }).error
        : undefined;
    throw new Error(
      typeof err === "string" && err !== "" ? err : `Stats request failed (${res.status}).`,
    );
  }

  const parsed = mealStatsSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Unexpected server response.");
  }
  return parsed.data;
}
