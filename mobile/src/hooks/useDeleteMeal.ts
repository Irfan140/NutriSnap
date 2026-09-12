import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    mutationFn: ({ id, getToken }: { id: string; getToken: () => Promise<string | null> }) => {
      if (!MEALS_URL) {
        throw missingServerUrl();
      }
      return deleteMealAnalysis(MEALS_URL, id, getToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
      void queryClient.invalidateQueries({ queryKey: ["meal-stats"] });
    },
  });
}
