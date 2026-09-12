# NutriSnap API — Bun runs TypeScript directly, so there is no build step.
# The same image serves all prod roles; the command is picked per service
# in docker-compose.prod.yml (api / worker / one-shot migrate).
FROM oven/bun:1-slim AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS release
ENV NODE_ENV=production
COPY --from=install /app/node_modules ./node_modules
COPY package.json bun.lock prisma7.config.ts ./
COPY prisma ./prisma
# prisma7.config.ts reads DATABASE_URL via env(), but generate never connects —
# a placeholder value is enough at build time. Real secrets come from the
# compose env_file at runtime.
RUN DATABASE_URL=postgresql://placeholder:5432/nutrisnap \
  bunx --bun prisma generate --config prisma7.config.ts
COPY src ./src
EXPOSE 3000
CMD ["bun", "src/index.ts"]
