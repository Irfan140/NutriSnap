import { useMutation } from "@tanstack/react-query";
import { authClient, getSessionToken } from "@/src/lib/auth";
import { deleteAccount } from "@/src/lib/meals-api";
import { ACCOUNT_URL } from "@/src/lib/server-url";

/**
 * Erases the whole account (meals, photos, profile), then signs out
 * locally. Throws `AUTH_EXPIRED` or a user-facing Error (handled by the
 * caller). The (auth) gate redirects once sign-out clears the session.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => {
      if (!ACCOUNT_URL) {
        throw new Error("Server URL is missing. Set EXPO_PUBLIC_SERVER_URL and restart Expo.");
      }
      return deleteAccount(ACCOUNT_URL, getSessionToken);
    },
    onSuccess: () => {
      void authClient.signOut();
    },
  });
}
