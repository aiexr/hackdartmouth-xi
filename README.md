# Deployment

https://hackdartmouth-xi.alex-6e4.workers.dev

# LeetSpeak

LeetSpeak is a role-specific mock interview practice app built with Next.js, TypeScript, Tailwind CSS, shadcn/ui patterns, and Cloudflare Workers via OpenNext.

The repo keeps the existing `design/` folder intact and uses it as the source of truth for:

- page structure
- visual language
- spacing and layout rhythm
- rounded card system
- soft indigo-on-warm-neutral palette
- progress-heavy interaction model

This implementation does not treat `design/` as production code. Instead, it translates the important design ideas into a real Next app-router project that can build and deploy through Cloudflare Workers.

## Current app surfaces

The current app includes the following user-facing routes:

- dashboard at `/`
- practice index redirect at `/practice`
- mock interview practice session at `/practice/[scenarioId]`
- feedback review at `/review/[scenarioId]`
- profile at `/profile`
- AI coach at `/coach`
- settings at `/settings`
- LLM sandbox at `/llm`
- sign-in shell at `/auth/sign-in`

The app now goes beyond structure-only UI:

- practice sessions can create and complete interview attempts through API routes
- transcripts can be appended during active interviews
- review pages can load persisted attempts and grading results
- dashboard and profile metrics can read interview history from MongoDB when configured
- LLM integration can be tested from the internal sandbox route

Current constraints:

- some UI copy and scenario content still comes from typed fixtures
- auth and data features are integration-dependent (graceful fallback when env is missing)
- LiveAvatar and ElevenLabs flow is scaffolded and partially wired, not production-hardened

## How the design folder was used

The app was based directly on the generated Figma Make output inside `design/`.

The main mappings were:

- `design/src/app/components/dashboard.tsx` informed the dashboard layout, suggested scenarios, weekly progress, streak treatment, and tracks section.
- `design/src/app/components/practice-session.tsx` informed the practice screen structure: top progress bar, centered interviewer stage, mic controls, and right-side hints/transcript/rubric panel.
- `design/src/app/components/review-feedback.tsx` informed the review flow: score hero, rubric breakdown, strengths, improvements, tips, and annotated transcript.
- `design/src/app/components/profile-page.tsx`, `coach-page.tsx`, and `settings-page.tsx` informed the supporting product surfaces.
- `design/src/styles/theme.css` informed the token palette: warm background, indigo primary, soft secondary surfaces, calm borders, and rounded card language.

The implementation preserves the spirit of the original design while adapting content to the current product framing:

- role tracks are now explicit
- scenarios are framed as repeatable interview loops
- integration readiness is visible
- the branding uses the requested product direction rather than the generated placeholder naming

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui-style components in `components/ui/`
- NextAuth.js with Google OAuth (JWT sessions)
- MongoDB Atlas for interview persistence and metrics
- LLM provider abstraction with OpenAI-compatible endpoint and Gemini support
- LiveAvatar session token + secret setup routes
- ElevenLabs call-mode agent wiring
- Cloudflare Workers deployment via `@opennextjs/cloudflare`
- `pdf-text-extract` + `mammoth` for server-side document extraction (PDF, DOCX)

## Agent compatibility

If Claude Code is used, create a symlink so it picks up the same agent instructions:

```bash
ln -s AGENTS.md CLAUDE.md
```

## Document Upload Feature

Users can optionally upload a resume or document (PDF, DOCX) during practice sessions. The document is extracted to plain text and included in the interview grading context so the LLM can reference the candidate's background and experience when evaluating performance.

Users can also persist a resume on their profile from `/profile`. That upload is stored directly in MongoDB on the user record, the extracted text is cached alongside it, and future interview grading can reuse it without requiring a fresh upload.

- File size limit: 10 MB
- One uploaded file per interview submission
- Supported formats: PDF, DOCX (Word)
- Upload is optional; interviews without documents are graded normally
- If extraction fails, the interview proceeds without the document context
- For Gemini provider with PDF uploads, grading uses native Gemini PDF understanding
- For DOCX uploads (or non-Gemini providers), extraction is handled server-side using `pdf-text-extract` (PDF) and `mammoth` (DOCX)

## Cloudflare / OpenNext setup

This project is set up for Cloudflare Workers using the current OpenNext path, not Pages static export and not `@cloudflare/next-on-pages`.

Added or updated:

- `wrangler.jsonc`
- `open-next.config.ts`
- `.dev.vars.example`
- `.gitignore` with `.open-next`
- `next.config.ts` with `initOpenNextCloudflareForDev()`
- `public/_headers` for static asset caching

Package scripts:

- `npm run dev` starts local Next development with `next dev`
- `npm run build` runs `next build`
- `npm run preview` runs the OpenNext Cloudflare preview flow
- `npm run deploy` runs the OpenNext Cloudflare deploy flow
- `npm run cf-typegen` generates Cloudflare env types
 
Important compatibility notes:

- no `next export`
- no static-only Pages output
- no `@cloudflare/next-on-pages`
- no `export const runtime = "edge"` was introduced
- `wrangler.jsonc` `name` and `services[].service` must match the actual Cloudflare Worker name used by Workers Builds for this repo

## File structure

### App router

- `app/layout.tsx`
  Root layout, metadata, and typography setup.
- `app/globals.css`
  Global Tailwind + theme token layer derived from the design output.
- `app/page.tsx`
  Main dashboard with goals, role track metrics, and recent improvement themes.
- `app/practice/page.tsx`
  Redirect route to the default scenario.
- `app/profile/page.tsx`
  User summary, mastery view, and achievements.
- `app/coach/page.tsx`
  AI coach surface.
- `app/settings/page.tsx`
  Product settings page.
- `app/llm/page.tsx`
  Internal LLM sandbox page.
- `app/auth/sign-in/page.tsx`
  NextAuth-oriented sign-in shell.
- `app/practice/[scenarioId]/page.tsx`
  Dynamic interview practice route.
- `app/review/[scenarioId]/page.tsx`
  Dynamic review route with persisted-attempt fallback behavior.
- `app/api/health/route.ts`
  Small health/status endpoint exposing integration readiness.
- `app/api/interview/start/route.ts`
  Creates a new in-progress interview document for the signed-in user.
- `app/api/interview/[id]/transcript/route.ts`
  Appends transcript turns to an in-progress interview.
- `app/api/interview/end/route.ts`
  Completes an interview and attempts LLM grading.
- `app/api/interview/[id]/route.ts`
  Returns a single interview by id for the signed-in user.
- `app/api/interviews/route.ts`
  Returns all interviews for the signed-in user.
- `app/api/llm/test/route.ts`
  Executes an LLM test prompt with optional provider override.
- `app/api/session/create/route.ts`
  Creates LiveAvatar video-mode session tokens or returns call-mode agent config.
- `app/api/session/setup-secret/route.ts`
  One-time helper for storing ElevenLabs API key in LiveAvatar secrets.

### Shared app components

- `components/app/main-shell.tsx`
  Desktop sidebar and mobile bottom navigation for the main app surfaces.
- `components/app/status-grid.tsx`
  Shows NextAuth, Gemini, ElevenLabs, and Mongo readiness on the dashboard.
- `components/app/practice-session.tsx`
  Live mock interview UI with timer, mic controls, prompt progression, and side panels.
- `components/app/coach-conversation.tsx`
  Coach chat UI and quick actions.
- `components/app/settings-panel.tsx`
  Toggle-based settings UI.
- `components/auth/sign-in-card.tsx`
  Entry auth card for the sign-in route.

### UI primitives

These are lightweight shadcn/ui-style primitives used by the MVP:

- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/progress.tsx`
- `components/ui/switch.tsx`
- `components/ui/badge.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`

### Data and service foundation

LLM architecture note: route app-level LLM calls through `lib/integrations/llm.ts` so provider selection, model overrides/fallbacks, defaults, and JSON parsing stay centralized.

- `data/scenarios.ts`
  Typed mock data for role tracks, scenarios, review payloads, profile data, and coach messages.
- `lib/utils.ts`
  Shared `cn()` utility.
- `lib/env.ts`
  Server-side env loading and readiness flags.
- `lib/auth.ts`
  NextAuth configuration with optional Google provider wiring.
- `lib/integrations/llm.ts`
  LLM provider router used by grading and sandbox routes.
- `lib/integrations/openai.ts`
  OpenAI-compatible provider client (Dartmouth endpoint by default).
- `lib/integrations/gemini.ts`
  Gemini provider client.
- `lib/interview-metrics.ts`
  Mongo-backed dashboard/profile metric aggregation with safe fallbacks.
- `lib/elevenlabs.ts`
  ElevenLabs helper scaffold.
- `lib/mongodb.ts`
  MongoDB Atlas connection helper.

### Deployment and platform files

- `next.config.ts`
- `open-next.config.ts`
- `wrangler.jsonc`
- `postcss.config.mjs`
- `components.json`
- `.dev.vars.example`
- `public/_headers`

### Preserved design source

- `design/`
  Kept untouched as requested. It remains the visual and structural reference artifact.

The production app excludes `design/` from TypeScript build checks so it stays in the repo without breaking Next compilation.

## Environment variables

Copy `.dev.vars.example` to `.dev.vars` and fill in values for:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (set to your local URL for dev; for Cloudflare prod, set `AUTH_TRUST_HOST=1` and do not hardcode this to a different domain)
- `AUTH_TRUST_HOST` (`1` in prod so NextAuth builds callback URLs from the request host)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `LLM_PROVIDER` (`openai` or `gemini`)
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `HEYGEN_API_KEY`

Optional LiveAvatar tuning vars used by `/api/session/create`:

- `HEYGEN_AVATAR_ID`
- `HEYGEN_CONTEXT_ID`
- `HEYGEN_LLM_CONFIG_ID`

## Local development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Generate Cloudflare env types:

```bash
npm run cf-typegen
```

Build for Next.js:

```bash
npm run build
```

Build for Cloudflare Workers with OpenNext:

```bash
npx opennextjs-cloudflare build
```

List available Dartmouth-hosted models for the OpenAI-compatible path:

```bash
npm run list-dartmouth-models
```

Preview in the Workers runtime:

```bash
npm run preview
```

Deploy:

```bash
npm run deploy
```

## Verification checklist

Use this quick checklist after configuration changes:

- `npm run build`
- `npm run cf-typegen`
- `npm run preview`
- `curl http://localhost:3000/api/health`

## Suggested next steps

Key product-hardening work:

1. finish the NextAuth sign-in flow and session-aware app gating
2. fully wire live transcript streaming and incremental step progression
3. harden interview-end grading reliability and retry behavior
4. deepen ElevenLabs voice playback integration inside interview loops
5. replace remaining fixture-driven content with dynamic DB-backed data
