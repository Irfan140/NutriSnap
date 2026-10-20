import { useInfiniteQuery } from "@tanstack/react-query";
import { authClient, getSessionToken } from "@/src/lib/auth";
import { fetchMealsPage } from "@/src/lib/meals-api";
import { MEALS_URL } from "@/src/lib/server-url";

/**
 * Newest-first meal history as an infinite query (20/page via
 * `fetchMealsPage`). Cache is scoped per Better Auth user. Screens drive
 * refresh/paging with `refetch()` / `fetchNextPage()`; a 401 surfaces as
 * an `AUTH_EXPIRED` error for the caller to sign out on.
 */
export function useMealHistory() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  return useInfiniteQuery({
    queryKey: ["meals", "history", userId],
    enabled: !!userId && !!MEALS_URL,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      if (!MEALS_URL) {
        throw new Error("Server URL is missing. Set EXPO_PUBLIC_SERVER_URL and restart Expo.");
      }
      return fetchMealsPage(MEALS_URL, pageParam, getSessionToken);
    },
    getNextPageParam: (lastPage) =>
      lastPage.items.length + (lastPage.page - 1) * lastPage.limit < lastPage.total
        ? lastPage.page + 1
        : undefined,
  });
}
