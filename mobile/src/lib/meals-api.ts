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
      throw authExpired();
    }

    const res = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      throw authExpired();
    }

    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      throw new UserFacingError(`Unexpected server response (${res.status}).`);
    }

    if (res.status === 404) {
      throw new UserFacingError("Analysis not found on the server.");
    }
    if (!res.ok && res.status !== 422) {
      throw new UserFacingError(`Analysis check failed (${res.status}).`);
    }

    const parsed = analysisStatusResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new UserFacingError("Unexpected server response.");
    }

    const status = parsed.data.status;
    if (status === "SUCCEEDED") {
      return { outcome: "succeeded", payload: parsed.data };
    }
    if (status === "FAILED") {
      return { outcome: "failed", payload: parsed.data };
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new UserFacingError("Analysis is taking too long. Please try again.");
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
    throw authExpired();
  }

  const res = await fetch(`${baseUrl}?page=${page}&limit=${MEALS_PAGE_LIMIT}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw authExpired();
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new UserFacingError(`Unexpected server response (${res.status}).`);
  }

  if (!res.ok) {
    const err =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error?: unknown }).error
        : undefined;
    throw new UserFacingError(
      typeof err === "string" && err !== "" ? err : `History request failed (${res.status}).`,
    );
  }

  const parsed = mealHistoryPageSchema.safeParse(payload);
  if (!parsed.success) {
    throw new UserFacingError("Unexpected server response.");
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
    throw authExpired();
  }

  const res = await fetch(statsUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw authExpired();
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new UserFacingError(`Unexpected server response (${res.status}).`);
  }

  if (!res.ok) {
    const err =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error?: unknown }).error
        : undefined;
    throw new UserFacingError(
      typeof err === "string" && err !== "" ? err : `Stats request failed (${res.status}).`,
    );
  }

  const parsed = mealStatsSchema.safeParse(payload);
  if (!parsed.success) {
    throw new UserFacingError("Unexpected server response.");
  }
  return parsed.data;
}

function errorMessageOf(payload: unknown, fallback: string): string {
  const err =
    typeof payload === "object" && payload !== null && "error" in payload
      ? (payload as { error?: unknown }).error
      : undefined;
  return typeof err === "string" && err !== "" ? err : fallback;
}

/**
 * Thrown for expected, user-facing failures (validation, 4xx, bad payloads,
 * failed analyses). Callers display `message` and must NOT log these as
 * errors — they are normal outcomes, not bugs.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

/** Control-flow signal for an expired Clerk session (caller signs out). */
export function authExpired(): Error {
  return new Error("AUTH_EXPIRED");
}

/**
 * Deletes one analysis (queued job, row, and private image).
 * Resolves on 204; throws `AUTH_EXPIRED` or a user-facing Error.
 */
export async function deleteMealAnalysis(
  baseUrl: string,
  id: string,
  getToken: () => Promise<string | null>,
): Promise<void> {
  const token = await getToken();
  if (!token) {
    throw authExpired();
  }

  const res = await fetch(`${baseUrl}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw authExpired();
  }
  if (res.status === 404) {
    throw new UserFacingError("Analysis not found. It may already be deleted.");
  }
  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      // Fall through to the generic message below.
    }
    throw new UserFacingError(errorMessageOf(payload, `Delete failed (${res.status}).`));
  }
}

/**
 * Erases the whole account (meals, photos, profile). Resolves on 204;
 * throws `AUTH_EXPIRED` or a user-facing Error (including the server's
 * needs-support message when data is gone but Clerk removal failed).
 */
export async function deleteAccount(
  apiBaseUrl: string,
  getToken: () => Promise<string | null>,
): Promise<void> {
  const token = await getToken();
  if (!token) {
    throw authExpired();
  }

  const res = await fetch(`${apiBaseUrl}/account`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw authExpired();
  }
  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      // Fall through to the generic message below.
    }
    throw new UserFacingError(errorMessageOf(payload, `Account deletion failed (${res.status}).`));
  }
}

/**
 * Fetches one analysis by id (detail screen). Throws `AUTH_EXPIRED` or a
 * user-facing Error. Non-terminal states are returned, never thrown.
 */
export async function fetchMealAnalysis(
  baseUrl: string,
  id: string,
  getToken: () => Promise<string | null>,
): Promise<AnalysisStatusResponse> {
  const token = await getToken();
  if (!token) {
    throw authExpired();
  }

  const res = await fetch(`${baseUrl}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw authExpired();
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new UserFacingError(`Unexpected server response (${res.status}).`);
  }

  if (res.status === 404) {
    throw new UserFacingError("Analysis not found. It may have been deleted.");
  }
  if (!res.ok && res.status !== 422) {
    throw new UserFacingError(errorMessageOf(payload, `Request failed (${res.status}).`));
  }

  const parsed = analysisStatusResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new UserFacingError("Unexpected server response.");
  }
  return parsed.data;
}
