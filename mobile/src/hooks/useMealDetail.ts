import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { fetchMealAnalysis } from "@/src/lib/meals-api";
import { MEALS_URL } from "@/src/lib/server-url";

/**
 * One analysis by id (detail screen). Single fetch — no polling; terminal
 * states render from the payload, anything else offers a manual retry via
 * `refetch()`. Cache is scoped per Clerk user and analysis id.
 */
export function useMealDetail(id: string | undefined) {
  const { userId, getToken } = useAuth();
  const validId = typeof id === "string" && id !== "" ? id : undefined;
  return useQuery({
    queryKey: ["meal", userId, validId],
    enabled: !!userId && !!validId && !!MEALS_URL,
    queryFn: () => {
      if (!MEALS_URL || !validId) {
        throw new Error("Could not open this analysis.");
      }
      return fetchMealAnalysis(MEALS_URL, validId, getToken);
    },
  });
}
