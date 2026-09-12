import { QueryClient } from "@tanstack/react-query";

/**
 * Shared TanStack Query client. Retries are disabled globally: our fetchers
 * throw `AUTH_EXPIRED` on 401 (which must surface immediately, never retry)
 * and implement their own polling/retry where a retry is actually correct
 * (e.g. `pollAnalysisUntilDone`).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

/** True when a fetcher failed only because the Clerk session expired. */
export function isAuthExpired(error: unknown): boolean {
  return error instanceof Error && error.message === "AUTH_EXPIRED";
}
