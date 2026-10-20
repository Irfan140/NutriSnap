import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessionToken } from "@/src/lib/auth";
import { deleteMealAnalysis } from "@/src/lib/meals-api";
import { MEALS_URL } from "@/src/lib/server-url";

function missingServerUrl(): Error {
  return new Error("Server URL is missing. Set EXPO_PUBLIC_SERVER_URL and restart Expo.");
}

/**
 * Deletes one analysis, then refreshes history/stats caches.
 * The caller handles navigation (e.g. `router.back()`) per-call.
 */
export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => {
      if (!MEALS_URL) {
        throw missingServerUrl();
      }
      return deleteMealAnalysis(MEALS_URL, id, getSessionToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
      void queryClient.invalidateQueries({ queryKey: ["meal-stats"] });
    },
  });
}
