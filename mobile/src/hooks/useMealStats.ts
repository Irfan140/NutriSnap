import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { fetchMealsStats } from "@/src/lib/meals-api";
import { STATS_URL } from "@/src/lib/server-url";

/**
 * Aggregate profile stats. Cache is scoped per Clerk user; screens refresh
 * on focus via `refetch()`. A 401 surfaces as an `AUTH_EXPIRED` error for
 * the caller to sign out on.
 */
export function useMealStats() {
  const { userId, getToken } = useAuth();
  return useQuery({
    queryKey: ["meal-stats", userId],
    enabled: !!userId && !!STATS_URL,
    queryFn: () => {
      if (!STATS_URL) {
        throw new Error("Server URL is missing. Set EXPO_PUBLIC_SERVER_URL and restart Expo.");
      }
      return fetchMealsStats(STATS_URL, getToken);
    },
  });
}
