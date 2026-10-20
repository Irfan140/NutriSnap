import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import { env } from "../config/env.config.js";
import { prisma } from "./prisma.lib.js";

/**
 * Google is the only sign-in method (mobile sends a native Google ID token
 * via `signIn.social({ provider: "google", idToken })`; no email/password).
 */
const googleProvider =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
    : undefined;

/**
 * Better Auth singleton (same exception pattern as the `prisma` and
 * `aiService` singletons). Serves `/api/auth/*` via `toNodeHandler` in
 * `app.ts` and backs `requireAuth` through `auth.api.getSession`.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL ?? `http://localhost:${env.PORT}`,
  trustedOrigins: [
    "nutrisnap://",
    // Expo dev clients load over exp:// deep links; harmless curl-less dev
    // convenience that must not ship to production.
    ...(env.NODE_ENV === "development" ? ["exp://**"] : []),
  ],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: false },
  // Missing Google creds keeps the server bootable (CI/smoke): provider
  // endpoints return an error until GOOGLE_CLIENT_ID/SECRET are configured.
  socialProviders: googleProvider ? { google: googleProvider } : {},
  plugins: [
    // Authenticates API requests via `Authorization: Bearer <session token>`
    // so native clients don't have to rely on cookies.
    bearer(),
    // Allows the Expo client plugin to resolve origins/deep links.
    expo(),
  ],
});

export type Session = typeof auth.$Infer.Session;
