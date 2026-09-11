# AGENTS.md — NutriSnap

> Instructions for AI coding agents working in this repository. Prefer repository evidence over assumptions. Keep changes scoped, typed, and verified.

## 1. Repository Overview

NutriSnap is a full-stack AI meal analyzer. Users authenticate (Clerk), pick a meal photo from the gallery, and receive an AI-generated nutrition breakdown (calories/macros/fiber/vitamins, health score 0-100, Markdown advice/alternatives/summary).

**Major services:**

| Service | Path | Runtime | Entry |
|---------|------|---------|-------|
| Mobile app | `mobile/` | Expo SDK 55 + React Native 0.83 + React 19 | `mobile/src/app/_layout.tsx` (expo-router) |
| Backend API | `server/` | Bun + Express 4 | `server/src/index.ts` → `server/src/app.ts` (+ `server/src/workers/index.ts` for jobs) |
| Static docs | `docs/` | HTML | Privacy / delete-account pages |
| Shared assets | `assets/` | PNG | `banner.png`, `architecture.png` (README) |

High-level flow: `mobile` (Clerk token) → `POST /api/uploads/presign` (gets short-lived R2 PUT URL) → mobile uploads JPEG straight to private R2 → `POST /api/aifood` (`{imageKey}`, returns `202 {analysisId}`) → BullMQ worker downloads from R2 → LangChain `ChatOpenAI` → Zod validates model JSON → persists `MealAnalysis` row → mobile polls `GET /api/aifood/:id` until `SUCCEEDED` and renders the formatted `message` (` ```json ` block + Markdown).

## 2. Repository Structure

```
NutriSnap/
├── mobile/                 # Expo app (expo-router)
│   ├── src/
│   │   ├── app/            # File-based routing — MUST respect expo-router groups
│   │   │   ├── _layout.tsx # Root: ClerkProvider + tokenCache + ThemeProvider + OTA prompt
│   │   │   ├── sso-callback.tsx
│   │   │   ├── (auth)/     # Unauthenticated: sign-in, sign-up, forgot-password
│   │   │   └── (app)/      # Authenticated gate (redirect if !isSignedIn)
│   │   │       └── (tabs)/ # Tabs: index (Home/analysis), profile, settings
│   │   ├── components/     # PrimaryButton, FormInput, Typography, OTAUpdatePrompt, GoogSignIn
│   │   ├── hooks/          # useOTAUpdate
│   │   ├── lib/            # validation.ts (Zod), nutrition.ts (response parsing), meals-api.ts (poll/presign schemas), meal-image.ts (normalize)
│   │   ├── theme/index.tsx # Light/dark tokens, ThemeProvider, healthScore helpers
│   │   └── config/env.ts  # Zod-validated EXPO_PUBLIC_* env
│   ├── assets/images/      # App icons, splash
│   ├── app.config.ts       # Dynamic config (variant-aware name/package), EAS projectId
│   ├── eas.json            # Build profiles: development / preview / production
│   ├── tsconfig.json       # Extends expo/tsconfig.base, alias @/* -> ./*
│   └── eslint.config.js    # eslint-config-expo/flat, ignores dist/*
├── server/                 # Bun + Express API
│   ├── src/
│   │   ├── app.ts          # Express app: cors, /api/webhooks (raw), json(10mb), requestLogger, clerkMiddleware, /health, /api
│   │   ├── index.ts        # Entry: app.listen(env.PORT)
│   │   ├── config/env.ts  # Zod-validated env (dotenv)
│   │   ├── routes/         # ai.routes.ts (POST /aifood 202 + GET /aifood/:id), uploads.routes.ts (POST /uploads/presign), webhooks.routes.ts (POST /webhooks/clerk), ai.controller.ts (thin handlers)
│   │   ├── middlewares/    # auth, rate-limit (aifood + presign), async, error, request-logger + express.d.ts (req.auth)
│   │   ├── services/       # ai.service.ts, ai.prompt.ts, ai.parser.ts, clerk-sync.service.ts
│   │   ├── lib/            # ai-model.ts (ChatOpenAI factory), prisma.ts (singleton), r2.ts (presigned URLs)
│   │   ├── schemas/        # meal.schema.ts, nutrition.schema.ts
│   │   ├── queues/         # meal-analysis.queue.ts (BullMQ enqueue)
│   │   ├── processors/     # meal-analysis.processor.ts (job handler)
│   │   ├── workers/        # index.ts (worker entry: dev:worker/start:worker)
│   │   ├── repositories/   # users.repository.ts, meal-analyses.repository.ts (Prisma data access)
│   │   └── utils/          # logger (pino), image (mime/base64 helpers)
│   ├── prisma/             # schema.prisma (User, MealAnalysis) + migrations/
│   ├── prisma7.config.ts   # Prisma 7 config (DATABASE_URL) — pass --config to CLI
│   └── tsconfig.json       # Bundler, strict, noEmit, allowImportingTsExtensions
├── docs/                   # Static HTML: delete-account/index.html, privacy/index.html
├── assets/                 # Repo-level images for README/architecture
├── skills-lock.json        # Committed — pins agent skills versions
└── .agents/                # Locally installed skills — ignored by Git (see .gitignore:1)
```

Path alias: `@/*` maps to repo root of `mobile/` per `mobile/tsconfig.json:5` (e.g., `@/src/components/...`). Server uses relative imports with `.js` extensions (ESM + `allowImportingTsExtensions`).

## 3. Technology Stack

**Mobile (`mobile/package.json:32-69`)**
- Expo SDK 55, Expo Router 55, React 19.2.8, React Native 0.83.10, TypeScript 5.9.2
- Auth: `@clerk/expo` 4.5.2 + `expo-secure-store` (tokenCache), `expo-auth-session`, `expo-web-browser`
- Media/UI: `expo-image-picker` 55, `expo-image-manipulator` 55, `expo-file-system` 55 (legacy `uploadAsync` for R2 PUT), `expo-image`, `react-native-markdown-display` 7.0.2, `react-native-circular-progress`, `@expo/vector-icons`, `expo-haptics`, `expo-font`, `expo-system-ui`, `expo-splash-screen`
- OTA/Observability: `expo-updates` 55, `expo-observe` 0.2.5 (`AppMetricsRoot`), `expo-insights` 55, `expo-constants`, `expo-linking`
- Validation: `zod` 4.4.3
- Lint: `eslint` 9 + `eslint-config-expo` flat config; React Compiler enabled (`app.config.ts:69`)

**Server (`server/package.json`)**
- Runtime: Bun (`server/package.json:3` `module: src/index.ts`)
- Framework: `express` 4.21, `@clerk/express` 2.1.56, `cors` 2.8, `express-rate-limit` 8.6
- AI: `@langchain/core` 1.2 + `@langchain/openai` 1.5 (`ChatOpenAI`), model `gpt-4o-mini` (configurable)
- Jobs: `bullmq` 6 (Redis via `REDIS_URL`); separate worker entry `src/workers/index.ts`
- Storage: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` against Cloudflare R2 (private bucket, short-lived presigned PUT/GET)
- DB: `prisma` 7 + `@prisma/client` + `@prisma/adapter-pg` (`pg`), schema in `prisma/schema.prisma`, config `prisma7.config.ts` (pass `--config` to CLI)
- Webhooks: `svix` (Clerk `user.created/updated/deleted` → `users` table)
- Validation: `zod` 4.4.3 (request + AI output)
- Logging: `pino` 10 + `pino-http` 11, `pino-pretty` (dev only) — redacts `authorization`/`cookie`
- Env: `dotenv` 17
- Lint: `eslint` 10 (`eslint.config.mjs`, flat) + `prettier` 3 (`.prettierrc`); scripts `lint`, `format`

## 4. Architecture

### Request flow
1. Mobile `ClerkProvider` (`mobile/src/app/_layout.tsx:16`) supplies Bearer token; `tokenCache` persists to SecureStore.
2. `mobile/src/app/(app)/(tabs)/index.tsx` normalizes the pick (`prepareMealImage`: ≤1024px JPEG) → `POST /api/uploads/presign` → PUTs the JPEG straight to private R2 via the presigned URL → `POST /api/aifood` (`{imageKey}`).
3. Server `server/src/app.ts` — middleware order matters: `cors()` → `/api/webhooks` on `express.raw()` (Svix needs raw bytes) → `express.json({limit:"10mb"})` → `requestLogger` → `clerkMiddleware()` → `/health` → `/api` → `notFoundHandler` → `errorHandler`.
4. `POST /api/aifood` chain: `requireAuth` (401 if missing) → `analyzeMealRateLimiter` (20 req/hour, key = `userId` or `ipKeyGenerator(ip)`) → HEAD-checks the R2 object (422 if missing/too large) → creates `QUEUED` `MealAnalysis` row → BullMQ enqueue → `202 {analysisId}`.
5. Worker (`src/workers/index.ts`, concurrency 3) downloads from R2 → `aiService.analyzeMeal` (same retry/parse/validate pipeline, now returns structured `analysis` + `message`) → persists `SUCCEEDED` row (nutrition columns + formatted `message`) or `FAILED` with user-facing error; provider failures throw so BullMQ retries (2 attempts, exponential backoff).
6. Mobile polls `GET /api/aifood/:id` (2.5s interval, 4min timeout in `meals-api.ts`) → on `SUCCEEDED` renders `message` via the existing `extractJsonBlock`/`parseNutritionData`/`extractMarkdown` path (score circle + macro rows + Markdown). `GET` also returns a fresh short-lived `imageUrl` (presigned R2 GET).
7. Clerk dashboard webhook → `POST /api/webhooks/clerk` (Svix-verified, `user.created/updated/deleted`) → upserts/deletes the `users` row; API calls `ensureUser` (lazy backstop via Clerk API) so FK constraints always hold.

### Boundaries
- Mobile never calls the AI provider or R2 directly except via server-issued short-lived presigned URLs; all AI goes through the job pipeline.
- Postgres persists `users` + `meal-analyses`; Redis holds BullMQ jobs; R2 holds private images (never public). Auth state lives in Clerk. `GET /health` is unauthenticated, excluded from request logs (`request-logger.middleware.ts:15`).
- Validation is duplicated: client (`mobile/src/lib/validation.ts`, `nutrition.ts`, `meals-api.ts`) and server (Zod schemas) — keep in sync.

## 5. Development Workflow

### Install

```bash
# mobile (Expo) — from mobile/
npm install

# server (Bun) — from server/
bun install
# alternative if Bun unavailable: npm install
```

### Run

```bash
# mobile — from mobile/
npm start              # expo start (then press a/i/w)
npm run android        # expo start --android
npm run ios            # expo start --ios
npm run web            # expo start --web

# server — from server/
bun --watch src/index.ts   # npm run dev
bun src/index.ts           # npm run start (prod)
bun --watch src/workers/index.ts  # npm run dev:worker (BullMQ, needs Redis up)
# If Bun task runner not available, use npx bun or node with tsx equivalent
```

Prisma (from `server/`, DB must be up — see root `docker-compose.yml`):

```bash
$env:DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/nutrisnap"
bunx --bun prisma migrate dev --name <name> --config prisma7.config.ts
bunx --bun prisma generate --config prisma7.config.ts  # or: npm run prisma:generate
```

Mobile requires env before start (see §10). Server reads `.env.development` (or `.env.production` when `NODE_ENV=production`) via `dotenv` in `server/src/config/env.ts:1`.

### Build / Deploy (EAS)

```bash
# from mobile/
npm run build:dev          # eas build --profile development --platform android
npm run build:preview      # eas build --profile preview --platform android
npm run build:prod         # eas build --profile production --platform android
npm run build:prod:ios     # eas build --profile production --platform ios
npm run build:prod:all     # eas build --profile production --platform all
npm run update:preview     # eas update --channel preview --environment preview
npm run update:prod        # eas update --channel production --environment production
npm run submit:prod        # eas submit --profile production --platform android
```

EAS projectId `d985a44e-3da0-457d-a618-aaaf8a077bf8`, runtimeVersion policy `appVersion` (`mobile/app.config.ts:79-84`). Build profiles defined in `mobile/eas.json:6-21`.

### Lint / Typecheck / Doctor

```bash
# mobile — from mobile/
npm run lint        # expo lint (eslint-config-expo flat)
npm run typecheck   # tsc --noEmit
npm run doctor      # npx expo-doctor
npm run check       # typecheck && lint && doctor (compound)

# server — from server/
npm run typecheck   # tsc --noEmit
npm run lint        # eslint src --max-warnings 0
npm run format:check  # prettier --check
# or: bun tsc --noEmit
```

No test script exists in this repo (verified `mobile/package.json`, `server/package.json` — no jest/vitest). Do not assume tests.

## 6. Coding Conventions

- **TypeScript strict** — both `tsconfig.json` set `strict:true`, `noUncheckedIndexedAccess:true`. Fix type errors rather than suppressing. Server uses `verbatimModuleSyntax` + `.js` extension imports.
- **Absolute imports (mobile)** — use `@/src/...` alias (`mobile/tsconfig.json:5` `@/* -> ./*`). Prefer `@/src/...` over deep relative paths for cross-directory imports. Server uses relative `./...js` ESM imports.
- **Validation with Zod** — MUST validate all external input with Zod. Client: `mobile/src/lib/validation.ts` (signIn/signUp), `mobile/src/lib/nutrition.ts` (apiErrorSchema/analyzeResponseSchema), `mobile/src/lib/meals-api.ts` (presign/enqueue/poll schemas). Server: `server/src/schemas/meal.schema.ts`, `server/src/schemas/nutrition.schema.ts`, `clerk-sync.service.ts` (`clerkWebhookEventSchema`). Use `safeParse`, return first issue message on 400.
- **Error handling** — Mobile: `index.tsx` orchestrates presign → PUT → enqueue → poll, handles 401 (signOut), non-ok JSON via `apiErrorSchema`, `AUTH_EXPIRED`/timeout via user-facing error modal + haptics; stale attempts ignored via `attemptRef`. Server: `202` on enqueue; `GET /:id` returns `QUEUED|PROCESSING` (200), `SUCCEEDED` (200 + `message`), `FAILED` (422 + `error`), `404` on foreign id; `503` when R2 is unconfigured; `error.middleware.ts` handles `entity.too.large` → 413 and logs via `req.log ?? logger`.
- **API conventions** — JSON over HTTPS; `POST /api/uploads/presign` (no body) → `{key, uploadUrl, expiresInSec}`; `POST /api/aifood` body `{imageKey: string}` (must be under caller's `meals/<userId>/` prefix) → `202 {analysisId, status}`; `GET /api/aifood/:id` → status/result; `POST /api/webhooks/clerk` takes raw Svix body. Health check `GET /health → {status:"ok"}`.
- **Logging** — Use `server/src/utils/logger.ts` (pino). Request logger adds `userId` prop, auto-ignores `/health`, maps 5xx→error/4xx→warn. Never log `Authorization`/`Cookie` (redacted). Client uses `console.error`/`console.warn` only in `__DEV__` / catch blocks.
- **Naming** — Components `PascalCase` (`PrimaryButton.tsx`), hooks `useXxx`, route groups `(auth)`/`(app)`/`(tabs)`, Zod schemas `xxxSchema`, logger `logger`, env `env`.
- **Styling** — Inline `StyleSheet.create` with theme tokens; never hardcode colors — use `useTheme().colors` + `radius`/`spacing` from `mobile/src/theme/index.tsx`. Dark/light variants required if adding UI.
- **Exports** — Prefer factory functions (`createAiController`, `createMealAnalysisModel`, `createAiService`) for testability/DI over singletons, except exported singleton `aiService` in `services/ai.service.ts:156` for wiring.

## 7. AI/Agent Development Rules

- **MUST inspect existing code before adding abstractions** — read target file + neighbours (e.g., existing `utils/image.ts`, `theme/index.tsx`) and reuse.
- **MUST reuse existing utilities/components** — `PrimaryButton`, `FormInput`, `Typography`, `useTheme`, `healthScoreColor`, `parseNutritionData`, `prepareMealImage`, `pollAnalysisUntilDone`, `toImageDataUri`/`detectImageMimeType`, `logger`, `asyncHandler`, `enqueueMealAnalysis`, `ensureUser`, repositories (`users`, `meal-analyses`).
- **MUST preserve architecture** — schema changes via Prisma migrate (never hand-edit migrations); do not add another auth provider or call the AI provider from mobile. Keep middleware order in `server/src/app.ts` (webhooks raw-first) and rate-limit keying (`userId ?? ip`).
- **MUST keep changes scoped** — modify only files required by the task. Do not reformat unrelated files, bump deps, or regenerate `expo-env.d.ts`/`dist/`.
- **SHOULD avoid new dependencies** — prefer existing libs (Zod, LangChain, Pino). If a dep is required, justify and use the lightest ESM-compatible option.
- **MUST never expose secrets** — do not log `OPENAI_API_KEY`/`CLERK_SECRET_KEY`, never commit `.env.local`/`.env.production`/any `.env` containing values, never inline secrets in code or docs.
- **MUST validate env** — add new env vars to `mobile/src/config/env.ts` or `server/src/config/env.ts` with Zod; update `.env.example` accordingly (values empty).
- **MUST follow existing patterns** — factory `createX`, `safeParse` + early return, `req.auth` augmentation via `server/src/middlewares/express.d.ts`, haptics + a11y props on mobile touchables.

## 8. Mobile Development

- **Expo Router** — File-based; groups `(auth)` and `(app)` are route groups (parentheses stripped). `_layout.tsx` per group handles auth gating (`useAuth().isLoaded/isSignedIn` + `Redirect`). Tabs defined in `(tabs)/_layout.tsx` with `Tabs`, `screenListeners.tabPress → Haptics.selectionAsync()`, absolute floating tabBar style. Enable `typedRoutes:true` + `reactCompiler:true` (`app.config.ts:68-71`) — typed `Link` hrefs required.
- **Clerk auth** — `ClerkProvider` + `tokenCache` from `@clerk/expo/token-cache` + `expo-secure-store` (`mobile/src/app/_layout.tsx:16`). Use `useAuth()`/`useSignIn()`/`useUser()`. Send `Authorization: Bearer ${await getToken()}` for API calls. On 401/missing token, `signOut()` and show user-facing message. See `sso-callback.tsx`, `GoogSignIn.tsx` for OAuth flow.
- **Image flow** — `expo-image-picker` with `quality:1`, `allowsEditing:true`. Normalize via `prepareMealImage` (`meal-image.ts`: ≤1024px JPEG via `expo-image-manipulator`, also converts HEIC) → `POST /api/uploads/presign` → PUT via `expo-file-system/legacy` `uploadAsync` (`BINARY_CONTENT`, `Content-Type: image/jpeg`) → `POST /api/aifood` → poll with `pollAnalysisUntilDone` (`meals-api.ts`). Request `MediaLibrary` permission first. Server caps uploads at 5 MiB (`lib/r2.ts:16`); presigned PUT URLs expire in 5 min.
- **Data fetching** — Raw `fetch` in `index.tsx` (no React Query/SWR currently). Presign/enqueue validate with `meals-api.ts` schemas, errors via `apiErrorSchema`, result `message` via the `nutrition.ts` path. If adding hooks, co-locate near `src/hooks/` or `src/lib/meals-api.ts`.
- **UI / Theme** — `ThemeProvider` (`src/theme/index.tsx:148`) reads `SecureStore` key `nutrisnap_theme_mode`, syncs with `useColorScheme`, exposes `colors`, `isDark`, `cardShadow`/`buttonShadow`, `setThemeMode`. Use `lightColors`/`darkColors` tokens; helpers `healthScoreColor(score, colors)` / `scoreLabel(score)`. All screens use `SafeAreaView` + `useSafeAreaInsets`. Apply `buttonShadow`/`cardShadow` from theme (light vs dark variants at `theme/index.tsx:96-114`).
- **OTA** — `useOTAUpdate` (`src/hooks/useOTAUpdate.ts`) wraps `expo-updates` with cooldown 30 min, auto-download, AppState foreground check. Displayed via `OTAUpdatePrompt` component. Do not break the `isUpdatePending`/`isUpdateAvailable` flow.
- **Observability** — `AppMetricsRoot.wrap(Layout)` + `AppMetrics.markInteractive()` (`_layout.tsx:26`). Keep for cold-start metrics.
- **Accessibility** — Provide `accessibilityRole`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState`, `hitSlop ≥ 4-8`, `textContentType`, `returnKeyType`. Follow `sign-in.tsx`/`FormInput.tsx` pattern.
- **Config** — Dynamic `app.config.ts` variant switching via `EAS_BUILD_PROFILE` env (`development|preview|production`) controls `name`/`android.package`/`slug`. `extra.eas.projectId` + `updates.url` required for OTA. Do not hardcode variant values elsewhere.

## 9. Backend Development

- **Structure** — Thin routes → controllers → services → AI/model. Routes wire deps (`routes/ai.routes.ts:9` `createAiController()` with injectable `MealAnalysisDeps`). Controllers are pure request/response + Zod parse; services own retry/business logic.
- **Auth** — `clerkMiddleware()` must stay before protected routes (`app.ts:13`). `requireAuth` (`middlewares/auth.middleware.ts:12`) checks `getAuth(req).userId`, sets `req.auth` (typed via `middlewares/express.d.ts`), 401 if absent.
- **Rate limiting** — `analyzeMealRateLimiter` (`middlewares/rate-limit.middleware.ts:11`): 20 req / 1 h, `keyGenerator: req.auth?.userId ?? ipKeyGenerator(ip)`, `standardHeaders draft-8`. Order after `requireAuth` so userId is available.
- **Validation** — `enqueueMealAnalysisSchema` (`schemas/meal.schema.ts:4`) enforces non-empty `imageKey`; controller additionally checks the key prefix (`isUserImageKey`), R2 HEAD existence and `MAX_UPLOAD_BYTES` (5 MiB). Image helpers in `utils/image.ts` sniff magic bytes (JPEG/PNG/WebP/GIF), handle `data:image/...;base64,` prefixes. Controller maps outcomes to status codes (422 for invalid-image/not-food/invalid-ai-response, 502 for provider-failure).
- **AI** — `ChatOpenAI` (`lib/ai-model.ts:4`) configured from env (`OPENAI_API_KEY`, `OPENAI_VISION_MODEL`, `AI_TEMPERATURE`, timeout 30s). Prompt in `services/ai.prompt.ts:3` forces raw JSON only. Parser `services/ai.parser.ts:20` tries 3 strategies (`tryExtractJson`, ` ```json ``` `, ` ``` ``` `) and validates via `nutritionAnalysisSchema`. Helpers `isFoodAnalysis`/`formatNutritionMessage` produce the wire format consumed by mobile.
- **Retry** — `services/ai.service.ts:55` `invokeWithRetry` retries 3× with exponential backoff (`BASE_DELAY_MS 1s`), special-cases 429/`rate_limit` and `retry-after` header. Logs each retry via `logger.warn`.
- **Error & logging** — `error.middleware.ts:17` maps `entity.too.large` → 413, logs unhandled via `req.log ?? logger` with method/url/err, returns 500 generic. `request-logger.middleware.ts` uses `pino-http`, ignores `/health`, adds `userId`. `logger.ts:17` uses `pino` with `LOG_LEVEL`, `isoTime`, redacts auth/cookie, pretty-prints only when `NODE_ENV=development`.
- **CORS/Body** — `cors()` default allow; `/api/webhooks` on `express.raw()` must precede `express.json({limit:"10mb"})` (Svix needs raw bytes; body-parser skips consumed requests). JSON errors handled by `errorHandler`.
- **Do not** bypass Zod, lower `MAX_UPLOAD_BYTES` (`lib/r2.ts`) without updating mobile prep size, or increase `json limit` beyond rate-limit intent.
- **Jobs** — BullMQ queue `meal-analysis` (`queues/meal-analysis.queue.ts`): job id = `MealAnalysis` row id (idempotent), 2 attempts with exponential backoff. Processor (`processors/meal-analysis.processor.ts`) downloads from R2 → `aiService.analyzeMeal` → persists row; terminal failures via `UnrecoverableError`, transient provider failures rethrown for retry. Worker entry `workers/index.ts` (concurrency 3, graceful SIGTERM/SIGINT).
- **Storage** — Private R2 bucket, never public. `lib/r2.ts`: `buildMealImageKey` (`meals/<userId>/<uuid>.jpg`), `isUserImageKey` prefix guard, short-lived presigned PUT (`R2_PRESIGN_PUT_TTL_SEC`) / GET (`R2_PRESIGN_GET_TTL_SEC`). `isR2Configured()` gates routes with `503` when creds are absent — never log `R2_SECRET_ACCESS_KEY`.
- **DB** — Prisma 7 via `lib/prisma.ts` singleton (`PrismaPg` adapter; reuse across `--watch` reloads). Data access only through `repositories/`; schema changes via `migrate dev`, never hand-edit `prisma/migrations/`. `MealAnalysis.user` has `onDelete: Cascade` (Clerk `user.deleted` wipes history).
- **Webhooks** — `POST /api/webhooks/clerk` is UNAUTHENTICATED (no `requireAuth`); trust comes from Svix signature only. Upsert on `user.created/updated`, delete on `user.deleted`; `ensureUser` lazy backstop on authenticated calls.

## 10. Environment Variables and Secrets

- **Files** — `mobile/.env.example` and `server/.env.example` are templates (commit). Actual values live in `mobile/.env.local` and `server/.env.development` (+ `server/.env.production`) — these are **ignored** (`mobile/.gitignore:34-45`, `server/.gitignore:18-24`) and MUST NOT be committed. Server loads via `dotenv` (`server/src/config/env.ts:1`); mobile vars are injected at build via Expo (`EXPO_PUBLIC_*`).

- **Mobile (`mobile/src/config/env.ts:3-13`)**
  - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — **required**, non-empty string.
  - `EXPO_PUBLIC_SERVER_URL` — optional, valid URL (omit scheme trailing slash). Example: `http://192.168.x.x:3000` (LAN IP for device). Validation throws `Invalid environment configuration` on startup if missing/invalid.

- **Server (`server/src/config/env.ts:4-14`)**
  - `PORT` — int positive, default `3000`.
  - `NODE_ENV` — `development|test|production`, default `production` (logger uses raw `process.env.NODE_ENV` for pretty vs JSON).
  - `LOG_LEVEL` — `fatal|error|warn|info|debug|trace`, default `info`.
  - `OPENAI_API_KEY` — **required**.
  - `OPENAI_VISION_MODEL` — default `gpt-4o-mini`.
  - `AI_TEMPERATURE` — 0–2, default `0.3`.
  - `AI_MODEL_PROVIDER` — default `openai` (logged in analysis completion).
  - `CLERK_SECRET_KEY` — **required**.
  - `CLERK_PUBLISHABLE_KEY` — **required**.
  - `CLERK_WEBHOOK_SECRET` — Svix secret for `POST /api/webhooks/clerk`; optional (route returns 500 if unset — set it in the Clerk dashboard webhook config).
  - `DATABASE_URL` — **required** (e.g. `postgresql://myuser:mypassword@localhost:5432/nutrisnap` from root `docker-compose.yml`).
  - `REDIS_URL` — default `redis://localhost:6379`.
  - `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` — optional; upload/analysis routes return `503` until set. Never log the secret.
  - `R2_PRESIGN_PUT_TTL_SEC` — default `300`. `R2_PRESIGN_GET_TTL_SEC` — default `900`.

- **Rules**
  - MUST add new vars to the appropriate `config/env.ts` Zod schema and `.env.example` (leave value empty).
  - MUST use `EXPO_PUBLIC_` prefix for any mobile-exposed var (Expo requirement).
  - NEVER echo, log, or commit actual secret values.

## 11. Agent Skills

- `skills-lock.json` (17 skills, `version:1`) is **committed** — it pins exact skill versions + hashes (sources `clerk/skills` + `expo/skills` via git). `AGENTS.md` MUST NOT duplicate individual skill docs.
- `.agents/` is **ignored** (`/.agents/` in root `.gitignore:1`) — contains locally installed skill content (` .agents/skills/<name>/SKILL.md`). Agents should not commit it.
- To restore skills after clone, use the skills installer that owns `skills-lock.json` (e.g., the project's `skills` / `opencode` CLI — check `README` or `skills --help`). Do not hand-edit `skills-lock.json` hashes; let the installer sync it.
- Reference skill `SKILL.md` files under `.agents/skills/<name>/` for detailed workflows (Clerk, Expo Router, EAS, etc.) when needed.

## 12. Git and Change Management

- **Branching** — `main` and `dev` exist (`git branch -a` shows `remotes/origin/main`, `remotes/origin/dev`, `HEAD -> origin/main`; active local is `dev`). No branch convention documented beyond `dev` as integration branch (merges like `Merge pull request #24 from Irfan140/dev`). Prefer feature branches off `dev` unless instructed otherwise.
- **Commit style** — Conventional-ish prefixes observed: `feat:`, `refactor:`, `chore:` with descriptive body (e.g., `chore: ignore installed agent skills`). Keep commits scoped.
- **Status before commit** — Verify `git status` / `git diff --stat` — only stage intended files; never stage `.env.local`, `node_modules/`, `dist/`, `.expo/`.
- **Ignored** — Root `.agents/`; mobile `node_modules/`, `.expo/`, `dist/`, `web-build/`, `expo-env.d.ts`, native keys (`*.jks`, `*.p8`, `*.mobileprovision`), `*.tsbuildinfo`, auto-generated `ios/`/`android/`; server `node_modules/`, `out/`, `dist/`, `coverage/`, `logs/`, dotenv locals, `.cache/`.
- **Generated** — Do not hand-edit `expo-env.d.ts`, `dist/`, `node_modules/` or commit them. `app.config.ts` is source of truth for `app.json`.

## 13. Verification Checklist

Run **only** checks that exist; skip absent ones (no tests).

- [ ] **Typecheck**
  ```bash
  # mobile
  cd mobile && npm run typecheck
  # server
  cd server && npm run typecheck
  # or bun tsc --noEmit
  ```
- [ ] **Lint**
  ```bash
  cd mobile && npm run lint
  cd server && npm run lint       # eslint --max-warnings 0
  cd server && npm run format:check  # prettier
  ```
- [ ] **Expo doctor** (mobile)
  ```bash
  cd mobile && npm run doctor
  # or: cd mobile && npm run check   # runs all three
  ```
- [ ] **Build dry-run / EAS validation** (if modifying `app.config.ts`/`eas.json`)
  ```bash
  cd mobile && npx expo-doctor && npx eas build --help >/dev/null
  ```
- [ ] **Server smoke**
  ```bash
  cd server && bun src/index.ts   # verify /health
  curl http://localhost:3000/health  # expect {"status":"ok"}
  cd server && bun src/workers/index.ts  # worker connects to Redis, no crash
  ```
  Without R2 creds, `POST /api/uploads/presign` must return `503` (not crash); `POST /api/webhooks/clerk` without signature must return `400`.
- [ ] **Migration check** (if touching `prisma/schema.prisma`)
  ```bash
  cd server && bunx --bun prisma migrate dev --name <name> --config prisma7.config.ts
  ```
- [ ] **Mobile manual**
  - Expo start loads without `Invalid environment configuration` error.
  - Sign-in → Home → pick image → Analyze succeeds (or shows expected 401/422/429 modal).
  - Tab press triggers haptics, theme toggle persists via SecureStore.
- [ ] **No secrets/ignored files staged** — `git status --ignored` shows `.env.local`/`.agents/` not staged.
- [ ] **No `AGENTS.md` invented conventions** — every rule references an existing file/pattern.

