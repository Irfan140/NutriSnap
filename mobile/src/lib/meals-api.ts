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
