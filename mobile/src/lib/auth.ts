import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { AUTH_URL } from "@/src/lib/server-url";

/**
 * Better Auth client bound to the server's `/api/auth` mount point
 * (`EXPO_PUBLIC_SERVER_URL` + `/api/auth`). Session cookies are persisted in
 * SecureStore by the Expo plugin, so the session survives app restarts.
 */
export const authClient = createAuthClient({
  baseURL: AUTH_URL,
  plugins: [
    // `scheme` must match the `scheme` in app.config.ts ("nutrisnap").
    expoClient({
      scheme: "nutrisnap",
      storagePrefix: "nutrisnap",
      storage: SecureStore,
      // Without this the plugin caches the last `get-session` payload in
      // SecureStore and hydrates it on cold start (before the server
      // validates), so a session wiped server-side (DB reset) still shows
      // the app as signed in until some screen's API call 401s and
      // `signOut()` clears the cache. Disabling the cache forces every
      // cold start to validate the persisted cookie against the server —
      // a dead session then redirects to sign-in immediately.
      disableCache: true,
    }),
  ],
});

/**
 * The Better Auth session token, or null when signed out. Sent as
 * `Authorization: Bearer <token>` for API calls — the server's `bearer()`
 * plugin only accepts token-authenticated requests. The token is the
 * `better-auth.session_token` cookie the Expo client persists in SecureStore.
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieHeader = await authClient.getCookie();
  const match = cookieHeader.match(/(?:^|;\s*)better-auth\.session_token=([^;]+)/);
  const value = match?.[1];
  if (!value) {
    return null;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
