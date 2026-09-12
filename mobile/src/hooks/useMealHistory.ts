import { useAuth } from "@clerk/expo";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMealsPage } from "@/src/lib/meals-api";
import { MEALS_URL } from "@/src/lib/server-url";

/**
 * Newest-first meal history as an infinite query (20/page via
 * `fetchMealsPage`). Cache is scoped per Clerk user. Screens drive
 * refresh/paging with `refetch()` / `fetchNextPage()`; a 401 surfaces as
 * an `AUTH_EXPIRED` error for the caller to sign out on.
 */
export function useMealHistory() {
  const { userId, getToken } = useAuth();
  return useInfiniteQuery({
    queryKey: ["meals", "history", userId],
    enabled: !!userId && !!MEALS_URL,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      if (!MEALS_URL) {
        throw new Error("Server URL is missing. Set EXPO_PUBLIC_SERVER_URL and restart Expo.");
      }
      return fetchMealsPage(MEALS_URL, pageParam, getToken);
    },
    getNextPageParam: (lastPage) =>
      lastPage.items.length + (lastPage.page - 1) * lastPage.limit < lastPage.total
        ? lastPage.page + 1
        : undefined,
  });
}
