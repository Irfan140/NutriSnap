import { useQuery } from "@tanstack/react-query";
import { authClient, getSessionToken } from "@/src/lib/auth";
import { fetchMealsStats } from "@/src/lib/meals-api";
import { STATS_URL } from "@/src/lib/server-url";

/**
 * Aggregate profile stats. Cache is scoped per Better Auth user; screens
 * refresh on focus via `refetch()`. A 401 surfaces as an `AUTH_EXPIRED`
 * error for the caller to sign out on.
 */
export function useMealStats() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["meal-stats", userId],
    enabled: !!userId && !!STATS_URL,
    queryFn: () => {
      if (!STATS_URL) {
        throw new Error("Server URL is missing. Set EXPO_PUBLIC_SERVER_URL and restart Expo.");
      }
      return fetchMealsStats(STATS_URL, getSessionToken);
    },
  });
}
