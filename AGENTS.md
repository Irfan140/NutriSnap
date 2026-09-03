# AGENTS.md — NutriSnap

> Instructions for AI coding agents working in this repository. Prefer repository evidence over assumptions. Keep changes scoped, typed, and verified.

## 1. Repository Overview

NutriSnap is a full-stack AI meal analyzer. Users authenticate (Clerk), pick a meal photo from the gallery, and receive an AI-generated nutrition breakdown (calories/macros/fiber/vitamins, health score 0-100, Markdown advice/alternatives/summary).

**Major services:**

| Service | Path | Runtime | Entry |
|---------|------|---------|-------|
| Mobile app | `mobile/` | Expo SDK 55 + React Native 0.83 + React 19 | `mobile/src/app/_layout.tsx` (expo-router) |
| Backend API | `server/` | Bun + Express 4 | `server/src/index.ts` → `server/src/server.ts` → `server/src/app.ts` |
| Static docs | `docs/` | HTML | Privacy / delete-account pages |
| Shared assets | `assets/` | PNG | `banner.png`, `architecture.png` (README) |

High-level flow (see `README.md:46-55`): `mobile` (Clerk token) → `POST /api/aifood` (base64 image) → Express validates auth/rate-limit/body/mime/size → LangChain `ChatGroq` (Groq vision model) → Zod validates model JSON → formatted `{"message": "..."}` → mobile parses ` ```json ` block + Markdown.

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
│   │   ├── lib/            # validation.ts (Zod), nutrition.ts (response parsing)
│   │   ├── theme/index.tsx # Light/dark tokens, ThemeProvider, healthScore helpers
│   │   └── config/env.ts  # Zod-validated EXPO_PUBLIC_* env
│   ├── assets/images/      # App icons, splash
│   ├── app.config.ts       # Dynamic config (variant-aware name/package), EAS projectId
│   ├── eas.json            # Build profiles: development / preview / production
│   ├── tsconfig.json       # Extends expo/tsconfig.base, alias @/* -> ./*
│   └── eslint.config.js    # eslint-config-expo/flat, ignores dist/*
├── server/                 # Bun + Express API
│   ├── src/
│   │   ├── app.ts          # Express app: cors, json(10mb), requestLogger, clerkMiddleware, /health, /api
│   │   ├── server.ts       # app.listen(env.PORT)
│   │   ├── config/env.ts  # Zod-validated env (dotenv)
│   │   ├── routes/ai.routes.ts    # POST /aifood — requireAuth → rateLimit → controller
│   │   ├── controllers/ai.controller.ts
│   │   ├── middleware/     # auth, rate-limit, async, error, request-logger
│   │   ├── ai/             # service, model, prompts, parsers, schemas
│   │   ├── schemas/request.schema.ts # analyzeMealRequestSchema
│   │   ├── utils/          # logger (pino), image (mime/base64 helpers)
│   │   └── types/          # nutrition.ts, express.d.ts (req.auth)
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
- Media/UI: `expo-image-picker` 55, `expo-image`, `react-native-markdown-display` 7.0.2, `react-native-circular-progress`, `@expo/vector-icons`, `expo-haptics`, `expo-font`, `expo-system-ui`, `expo-splash-screen`
- OTA/Observability: `expo-updates` 55, `expo-observe` 0.2.5 (`AppMetricsRoot`), `expo-insights` 55, `expo-constants`, `expo-linking`
- Validation: `zod` 4.4.3
- Lint: `eslint` 9 + `eslint-config-expo` flat config; React Compiler enabled (`app.config.ts:69`)

**Server (`server/package.json:11-27`)**
- Runtime: Bun (`server/package.json:3` `module: src/index.ts`)
- Framework: `express` 4.21, `@clerk/express` 2.1.56, `cors` 2.8, `express-rate-limit` 8.6
- AI: `@langchain/core` 1.2 + `@langchain/groq` 1.3 (`ChatGroq`), model `qwen/qwen3.6-27b` (configurable)
- Validation: `zod` 4.4.3 (request + AI output)
- Logging: `pino` 10 + `pino-http` 11, `pino-pretty` (dev only) — redacts `authorization`/`cookie`
- Env: `dotenv` 17

## 4. Architecture

### Request flow
1. Mobile `ClerkProvider` (`mobile/src/app/_layout.tsx:16`) supplies Bearer token; `tokenCache` persists to SecureStore.
2. `mobile/src/app/(app)/(tabs)/index.tsx:242` calls `getToken()` → `fetch(${EXPO_PUBLIC_SERVER_URL}/api/aifood, {Authorization: Bearer <token>, body:{image: base64}})`. Client enforces 8 MiB base64 limit (`index.tsx:43`).
3. Server `server/src/app.ts:10-19` — middleware order matters: `cors()` → `express.json({limit:"10mb"})` → `requestLogger` → `clerkMiddleware()` → `/health` → `/api` → `notFoundHandler` → `errorHandler`.
4. `server/src/routes/ai.routes.ts:11` — `POST /api/aifood` chain: `requireAuth` (checks `getAuth(req).userId`, attaches `req.auth`, 401 if missing) → `analyzeMealRateLimiter` (20 req/hour, key = `userId` or `ipKeyGenerator(ip)`, 429 with custom JSON) → `asyncHandler(aiController.analyzeMeal)`.
5. Controller `server/src/controllers/ai.controller.ts:17` validates body via `analyzeMealRequestSchema` (base64 check, `MAX_IMAGE_BASE64_LENGTH` 200 KiB, mime sniff JPEG/PNG/WebP/GIF). Delegates to `aiService.analyzeMeal`.
6. Service `server/src/ai/service.ts:46` builds `nutritionPrompt.pipe(ChatGroq)` chain, `invokeWithRetry` (3 retries, exponential backoff, special 429 handling), parses via `parseNutritionText` (strips Qwen `thinking` preamble, tries raw/fenced JSON), validates with `nutritionBreakdownSchema`/`nutritionAnalysisSchema`, formats success as `` ```json\n{nutrition}\n```\n\n## Health Advice\n...\n## Alternative Suggestions\n...\n## Summary\n... ``.
7. Mobile parses `analyzeResponseSchema` → `extractJsonBlock` → `parseNutritionData` → `extractMarkdown` and renders score circle + macro rows + Markdown.

### Boundaries
- Mobile never calls Groq directly; all AI goes through `POST /api/aifood`.
- Server is stateless; no DB. Auth state lives in Clerk. `GET /health` is unauthenticated, excluded from request logs (`request-logger.middleware.ts:15`).
- Validation is duplicated: client (`mobile/src/lib/validation.ts`, `nutrition.ts`) and server (Zod schemas) — keep in sync.

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
# If Bun task runner not available, use npx bun or node with tsx equivalent
```

Mobile requires env before start (see §10). Server reads `.env.local` via `dotenv/config` in `server/src/config/env.ts:1`.

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
# or: bun tsc --noEmit
```

No test script exists in this repo (verified `mobile/package.json`, `server/package.json` — no jest/vitest). Do not assume tests.

## 6. Coding Conventions

- **TypeScript strict** — both `tsconfig.json` set `strict:true`, `noUncheckedIndexedAccess:true`. Fix type errors rather than suppressing. Server uses `verbatimModuleSyntax` + `.js` extension imports.
- **Absolute imports (mobile)** — use `@/src/...` alias (`mobile/tsconfig.json:5` `@/* -> ./*`). Prefer `@/src/...` over deep relative paths for cross-directory imports. Server uses relative `./...js` ESM imports.
- **Validation with Zod** — MUST validate all external input with Zod. Client: `mobile/src/lib/validation.ts` (signIn/signUp), `mobile/src/lib/nutrition.ts` (apiErrorSchema/analyzeResponseSchema). Server: `server/src/schemas/request.schema.ts`, `server/src/ai/schemas.ts`. Use `safeParse`, return first issue message on 400.
- **Error handling** — Mobile: `index.tsx` validates before fetch, handles 401 (signOut), non-ok JSON via `apiErrorSchema`, missing/invalid AI block as user-facing error modal + haptics. Server: controller returns typed status discriminants (`success|invalid-image|not-food|invalid-ai-response|provider-failure`) mapped to 200/422/502/500; `error.middleware.ts` handles `entity.too.large` → 413 and logs via `req.log ?? logger`.
- **API conventions** — JSON over HTTPS; `POST /api/aifood` body `{image: string}` (data URI or bare base64), response `{message: string}` on success else `{error: string}`. Health check `GET /health → {status:"ok"}`.
- **Logging** — Use `server/src/utils/logger.ts` (pino). Request logger adds `userId` prop, auto-ignores `/health`, maps 5xx→error/4xx→warn. Never log `Authorization`/`Cookie` (redacted). Client uses `console.error`/`console.warn` only in `__DEV__` / catch blocks.
- **Naming** — Components `PascalCase` (`PrimaryButton.tsx`), hooks `useXxx`, route groups `(auth)`/`(app)`/`(tabs)`, Zod schemas `xxxSchema`, logger `logger`, env `env`.
- **Styling** — Inline `StyleSheet.create` with theme tokens; never hardcode colors — use `useTheme().colors` + `radius`/`spacing` from `mobile/src/theme/index.tsx`. Dark/light variants required if adding UI.
- **Exports** — Prefer factory functions (`createAiController`, `createMealAnalysisModel`, `createAiService`) for testability/DI over singletons, except exported singleton `aiService` in `ai/service.ts:156` for wiring.

## 7. AI/Agent Development Rules

- **MUST inspect existing code before adding abstractions** — read target file + neighbours (e.g., existing `utils/image.ts`, `theme/index.tsx`) and reuse.
- **MUST reuse existing utilities/components** — `PrimaryButton`, `FormInput`, `Typography`, `useTheme`, `healthScoreColor`, `parseNutritionData`, `fieldErrorMessage`, `toImageDataUri`/`detectImageMimeType`, `logger`, `asyncHandler`.
- **MUST preserve architecture** — do not add DB, new auth provider, or call Groq from mobile. Keep middleware order in `server/src/app.ts` and rate-limit keying (`userId ?? ip`).
- **MUST keep changes scoped** — modify only files required by the task. Do not reformat unrelated files, bump deps, or regenerate `expo-env.d.ts`/`dist/`.
- **SHOULD avoid new dependencies** — prefer existing libs (Zod, LangChain, Pino). If a dep is required, justify and use the lightest ESM-compatible option.
- **MUST never expose secrets** — do not log `GROQ_API_KEY`/`CLERK_SECRET_KEY`, never commit `.env.local`/`.env.production`/any `.env` containing values, never inline secrets in code or docs.
- **MUST validate env** — add new env vars to `mobile/src/config/env.ts` or `server/src/config/env.ts` with Zod; update `.env.example` accordingly (values empty).
- **MUST follow existing patterns** — factory `createX`, `safeParse` + early return, `req.auth` augmentation via `server/src/types/express.d.ts`, haptics + a11y props on mobile touchables.

## 8. Mobile Development

- **Expo Router** — File-based; groups `(auth)` and `(app)` are route groups (parentheses stripped). `_layout.tsx` per group handles auth gating (`useAuth().isLoaded/isSignedIn` + `Redirect`). Tabs defined in `(tabs)/_layout.tsx` with `Tabs`, `screenListeners.tabPress → Haptics.selectionAsync()`, absolute floating tabBar style. Enable `typedRoutes:true` + `reactCompiler:true` (`app.config.ts:68-71`) — typed `Link` hrefs required.
- **Clerk auth** — `ClerkProvider` + `tokenCache` from `@clerk/expo/token-cache` + `expo-secure-store` (`mobile/src/app/_layout.tsx:16`). Use `useAuth()`/`useSignIn()`/`useUser()`. Send `Authorization: Bearer ${await getToken()}` for API calls. On 401/missing token, `signOut()` and show user-facing message. See `sso-callback.tsx`, `GoogSignIn.tsx` for OAuth flow.
- **Image flow** — `expo-image-picker` with `quality:0.25`, `allowsEditing:true`, `base64:true`. Validate size client-side vs `8 MiB` before fetch; request `MediaLibrary` permission first. Policy for server max is 200 KiB (`server/src/utils/image.ts:7`) — consider aligning/compressing if adding uploads.
- **Data fetching** — Raw `fetch` in `index.tsx:249` (no React Query/SWR currently). Validate response with `analyzeResponseSchema`/`apiErrorSchema` before use. If adding hooks, co-locate near `src/hooks/` or `src/lib/nutrition.ts`.
- **UI / Theme** — `ThemeProvider` (`src/theme/index.tsx:148`) reads `SecureStore` key `nutrisnap_theme_mode`, syncs with `useColorScheme`, exposes `colors`, `isDark`, `cardShadow`/`buttonShadow`, `setThemeMode`. Use `lightColors`/`darkColors` tokens; helpers `healthScoreColor(score, colors)` / `scoreLabel(score)`. All screens use `SafeAreaView` + `useSafeAreaInsets`. Apply `buttonShadow`/`cardShadow` from theme (light vs dark variants at `theme/index.tsx:96-114`).
- **OTA** — `useOTAUpdate` (`src/hooks/useOTAUpdate.ts`) wraps `expo-updates` with cooldown 30 min, auto-download, AppState foreground check. Displayed via `OTAUpdatePrompt` component. Do not break the `isUpdatePending`/`isUpdateAvailable` flow.
- **Observability** — `AppMetricsRoot.wrap(Layout)` + `AppMetrics.markInteractive()` (`_layout.tsx:26`). Keep for cold-start metrics.
- **Accessibility** — Provide `accessibilityRole`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState`, `hitSlop ≥ 4-8`, `textContentType`, `returnKeyType`. Follow `sign-in.tsx`/`FormInput.tsx` pattern.
- **Config** — Dynamic `app.config.ts` variant switching via `EAS_BUILD_PROFILE` env (`development|preview|production`) controls `name`/`android.package`/`slug`. `extra.eas.projectId` + `updates.url` required for OTA. Do not hardcode variant values elsewhere.

## 9. Backend Development

- **Structure** — Thin routes → controllers → services → AI/model. Routes wire deps (`routes/ai.routes.ts:9` `createAiController(aiService)`). Controllers are pure request/response + Zod parse; services own retry/business logic.
- **Auth** — `clerkMiddleware()` must stay before protected routes (`app.ts:13`). `requireAuth` (`middleware/auth.middleware.ts:12`) checks `getAuth(req).userId`, sets `req.auth` (typed via `types/express.d.ts`), 401 if absent.
- **Rate limiting** — `analyzeMealRateLimiter` (`middleware/rate-limit.middleware.ts:11`): 20 req / 1 h, `keyGenerator: req.auth?.userId ?? ipKeyGenerator(ip)`, `standardHeaders draft-8`. Order after `requireAuth` so userId is available.
- **Validation** — `analyzeMealRequestSchema` (`schemas/request.schema.ts:4`) enforces `isBase64Image`, `!isImageTooLarge` (200 KiB), `detectImageMimeType !== null`. Image helpers in `utils/image.ts` sniff magic bytes (JPEG/PNG/WebP/GIF), handle `data:image/...;base64,` prefixes. Controller maps outcomes to status codes (422 for invalid-image/not-food/invalid-ai-response, 502 for provider-failure).
- **AI** — `ChatGroq` (`ai/model.ts:4`) configured from env (`GROQ_API_KEY`, `GROQ_VISION_MODEL`, `AI_TEMPERATURE`, timeout 30s). Prompt in `ai/prompts.ts:3` forces raw JSON only. Parser `parsers.ts:20` strips Qwen `thinking` preamble, tries 3 strategies (`tryExtractJson`, ` ```json ``` `, ` ``` ``` `) and validates via `nutritionAnalysisSchema`. Helpers `isFoodAnalysis`/`formatNutritionMessage` produce the wire format consumed by mobile.
- **Retry** — `service.ts:55` `invokeWithRetry` retries 3× with exponential backoff (`BASE_DELAY_MS 1s`), special-cases 429/`rate_limit` and `retry-after` header. Logs each retry via `logger.warn`.
- **Error & logging** — `error.middleware.ts:17` maps `entity.too.large` → 413, logs unhandled via `req.log ?? logger` with method/url/err, returns 500 generic. `request-logger.middleware.ts` uses `pino-http`, ignores `/health`, adds `userId`. `logger.ts:17` uses `pino` with `LOG_LEVEL`, `isoTime`, redacts auth/cookie, pretty-prints only when `NODE_ENV=development`.
- **CORS/Body** — `cors()` default allow, `express.json({limit:"10mb"})` must precede body parsing errors (handled by `errorHandler`).
- **Do not** bypass Zod, lower `MAX_IMAGE_BASE64_LENGTH` without updating mobile quality/size, or increase `json limit` beyond rate-limit intent.

## 10. Environment Variables and Secrets

- **Files** — `mobile/.env.example` and `server/.env.example` are templates (commit). Actual values live in `mobile/.env.local` and `server/.env.local` (+ `server/.env.production`) — these are **ignored** (`mobile/.gitignore:34-45`, `server/.gitignore:18-24`) and MUST NOT be committed. Server loads via `dotenv/config` (`server/src/config/env.ts:1`); mobile vars are injected at build via Expo (`EXPO_PUBLIC_*`).

- **Mobile (`mobile/src/config/env.ts:3-13`)**
  - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — **required**, non-empty string.
  - `EXPO_PUBLIC_SERVER_URL` — optional, valid URL (omit scheme trailing slash). Example: `http://192.168.x.x:3000` (LAN IP for device). Validation throws `Invalid environment configuration` on startup if missing/invalid.

- **Server (`server/src/config/env.ts:4-14`)**
  - `PORT` — int positive, default `3000`.
  - `NODE_ENV` — `development|test|production`, default `production` (logger uses raw `process.env.NODE_ENV` for pretty vs JSON).
  - `LOG_LEVEL` — `fatal|error|warn|info|debug|trace`, default `info`.
  - `GROQ_API_KEY` — **required**.
  - `GROQ_VISION_MODEL` — default `qwen/qwen3.6-27b`.
  - `AI_TEMPERATURE` — 0–2, default `0.3`.
  - `AI_MODEL_PROVIDER` — default `groq` (logged in analysis completion).
  - `CLERK_SECRET_KEY` — **required**.
  - `CLERK_PUBLISHABLE_KEY` — **required**.

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
  ```
- [ ] **Mobile manual**
  - Expo start loads without `Invalid environment configuration` error.
  - Sign-in → Home → pick image → Analyze succeeds (or shows expected 401/422/429 modal).
  - Tab press triggers haptics, theme toggle persists via SecureStore.
- [ ] **No secrets/ignored files staged** — `git status --ignored` shows `.env.local`/`.agents/` not staged.
- [ ] **No `AGENTS.md` invented conventions** — every rule references an existing file/pattern.

