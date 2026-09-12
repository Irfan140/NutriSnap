import { useAuth } from "@clerk/expo";
import { FileSystemUploadType, uploadAsync } from "expo-file-system/legacy";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { prepareMealImage } from "@/src/lib/meal-image";
import {
  enqueueAnalysisResponseSchema,
  pollAnalysisUntilDone,
  presignUploadResponseSchema,
} from "@/src/lib/meals-api";
import { apiErrorSchema } from "@/src/lib/nutrition";
import { MEALS_URL, PRESIGN_URL } from "@/src/lib/server-url";

export type AnalyzeMealInput = {
  readonly uri: string;
  readonly width?: number;
  readonly height?: number;
};

export type AnalyzeMealResult = {
  readonly analysisId: string;
  readonly message: string;
};

/**
 * Full analysis pipeline as one mutation: normalize → presign → direct PUT
 * → enqueue (202) → poll until done. Throws user-facing Errors (or
 * `AUTH_EXPIRED`); the caller renders `message` and handles sign-out.
 * History/stats caches invalidate on success.
 */
async function runAnalyzeFlow(
  input: AnalyzeMealInput,
  getToken: () => Promise<string | null>,
): Promise<AnalyzeMealResult> {
  if (!PRESIGN_URL || !MEALS_URL) {
    throw new Error(
      "Server URL is missing. Set EXPO_PUBLIC_SERVER_URL in your environment and restart Expo.",
    );
  }

  // 1. Normalize to a compact JPEG (also converts iOS HEIC).
  const prepared = await prepareMealImage(input.uri, input.width, input.height);

  // 2. Ask the server for a short-lived direct-upload URL.
  let token = await getToken();
  if (!token) {
    throw new Error("AUTH_EXPIRED");
  }
  const presignRes = await fetch(PRESIGN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: "{}",
  });
  if (presignRes.status === 401) {
    throw new Error("AUTH_EXPIRED");
  }
  const presignPayload: unknown = await presignRes.json().catch(() => null);
  if (!presignRes.ok) {
    const parsedError = apiErrorSchema.safeParse(presignPayload);
    throw new Error(
      parsedError.success ? parsedError.data.error : "Could not prepare the photo upload.",
    );
  }
  const presign = presignUploadResponseSchema.safeParse(presignPayload);
  if (!presign.success) {
    throw new Error("Could not prepare the photo upload. Please try again.");
  }

  // 3. Upload the JPEG straight to private object storage.
  const upload = await uploadAsync(presign.data.uploadUrl, prepared.uri, {
    httpMethod: "PUT",
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": "image/jpeg" },
  });
  if (upload.status !== 200) {
    throw new Error("Photo upload failed. Please check your connection and try again.");
  }

  // 4. Enqueue the background analysis (202) and poll until it finishes.
  token = await getToken();
  if (!token) {
    throw new Error("AUTH_EXPIRED");
  }
  const enqueueRes = await fetch(MEALS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imageKey: presign.data.key }),
  });
  if (enqueueRes.status === 401) {
    throw new Error("AUTH_EXPIRED");
  }
  const enqueuePayload: unknown = await enqueueRes.json().catch(() => null);
  if (!enqueueRes.ok && enqueueRes.status !== 202) {
    const parsedError = apiErrorSchema.safeParse(enqueuePayload);
    throw new Error(parsedError.success ? parsedError.data.error : "Error analyzing image");
  }
  const enqueued = enqueueAnalysisResponseSchema.safeParse(enqueuePayload);
  if (!enqueued.success) {
    throw new Error("Error analyzing image. Please try again.");
  }

  const final = await pollAnalysisUntilDone(
    `${MEALS_URL}/${enqueued.data.analysisId}`,
    getToken,
  );
  if (final.outcome === "failed") {
    throw new Error(final.payload.error ?? "Analysis failed. Please try with a clearer food image.");
  }
  return { analysisId: enqueued.data.analysisId, message: final.payload.message ?? "" };
}

export function useAnalyzeMeal() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnalyzeMealInput) => runAnalyzeFlow(input, getToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
      void queryClient.invalidateQueries({ queryKey: ["meal-stats"] });
    },
  });
}
