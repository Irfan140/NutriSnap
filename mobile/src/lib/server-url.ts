import { env } from "@/src/config/env";

/** Single source of truth for backend URLs (was duplicated per screen). */
export const SERVER_URL = env.EXPO_PUBLIC_SERVER_URL?.replace(/\/$/, "");
export const MEALS_URL = SERVER_URL ? `${SERVER_URL}/api/aifood` : undefined;
export const PRESIGN_URL = SERVER_URL ? `${SERVER_URL}/api/uploads/presign` : undefined;
export const STATS_URL = SERVER_URL ? `${SERVER_URL}/api/aifood/stats` : undefined;
export const ACCOUNT_URL = SERVER_URL ? `${SERVER_URL}/api/account` : undefined;
