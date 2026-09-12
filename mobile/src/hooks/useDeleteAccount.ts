import { useAuth } from "@clerk/expo";
import { useMutation } from "@tanstack/react-query";
import { deleteAccount } from "@/src/lib/meals-api";
import { ACCOUNT_URL } from "@/src/lib/server-url";

/**
 * Erases the whole account, then signs out locally. A 502 with the
 * needs-support message surfaces when data is gone but Clerk removal failed.
 */
export function useDeleteAccount() {
  const { signOut } = useAuth();
  return useMutation({
    mutationFn: (getToken: () => Promise<string | null>) => {
      if (!ACCOUNT_URL) {
        throw new Error("Server URL is missing. Set EXPO_PUBLIC_SERVER_URL and restart Expo.");
      }
      return deleteAccount(ACCOUNT_URL, getToken);
    },
    onSuccess: () => {
      void signOut();
    },
  });
}
