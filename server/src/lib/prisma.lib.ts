import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.config.js";
import { PrismaClient } from "../../generated/prisma/client.js";

declare global {
  var __nutrisnapPrisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Reuse the client across Bun --watch reloads so dev doesn't exhaust the
// Postgres connection pool (max_connections=100 in docker-compose.yml).
export const prisma: PrismaClient =
  globalThis.__nutrisnapPrisma ?? (globalThis.__nutrisnapPrisma = createPrismaClient());
