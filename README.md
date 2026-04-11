# Deployment

https://hackdartmouth-xi.alex-6e4.workers.dev

# LeetCode for Interviews

`LeetCode for Interviews` is a clean MVP foundation for a role-specific mock interview practice app built with Next.js, TypeScript, Tailwind CSS, shadcn/ui patterns, and Cloudflare Workers via OpenNext.

The repo keeps the existing `design/` folder intact and uses it as the source of truth for:

- page structure
- visual language
- spacing and layout rhythm
- rounded card system
- soft indigo-on-warm-neutral palette
- progress-heavy interaction model

This implementation does not treat `design/` as production code. Instead, it translates the important design ideas into a real Next app-router project that can build and deploy through Cloudflare Workers.

## What we built

I created the first working app foundation with the following product surfaces:

- dashboard at `/`
- mock interview practice session at `/practice/[scenarioId]`
- feedback review at `/review/[scenarioId]`
- profile at `/profile`
- AI coach at `/coach`
- settings at `/settings`
- sign-in shell at `/auth/sign-in`
- health endpoint at `/api/health`

The current MVP is intentionally structure-first:

- buttons do not yet execute full product logic
- interview content is mocked and typed
- practice, transcript, feedback, and progress all render as working UI
- backend integrations are scaffolded and env-wired, but not fully connected

## How the design folder was used

The app was based directly on the generated Figma Make output inside `design/`.

The main mappings were:

- `design/src/app/components/dashboard.tsx` informed the dashboard layout, suggested scenarios, weekly progress, streak treatment, and tracks section.
- `design/src/app/components/practice-session.tsx` informed the practice screen structure: top progress bar, centered interviewer stage, mic controls, and right-side hints/transcript/rubric panel.
- `design/src/app/components/review-feedback.tsx` informed the review flow: score hero, rubric breakdown, strengths, improvements, tips, and annotated transcript.
- `design/src/app/components/profile-page.tsx`, `coach-page.tsx`, and `settings-page.tsx` informed the supporting product surfaces.
- `design/src/styles/theme.css` informed the token palette: warm background, indigo primary, soft secondary surfaces, calm borders, and rounded card language.

I preserved the spirit of the original design while adapting the content to the actual product framing:

- role tracks are now explicit
- scenarios are framed as repeatable interview loops
- integration readiness is visible
- the branding uses the requested product direction rather than the generated placeholder naming

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui-style components in `components/ui/`
- Firebase Auth client scaffold
- Gemini request scaffold
- ElevenLabs request scaffold
- MongoDB Atlas connection scaffold
- Cloudflare Workers deployment via `@opennextjs/cloudflare`

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
- `.github/workflows/cloudflare-deploy.yml` runs the production Cloudflare deploy from GitHub Actions on pushes to `main`
 
Important compatibility notes:

- no `next export`
- no static-only Pages output
- no `@cloudflare/next-on-pages`
- no `export const runtime = "edge"` was introduced
- `wrangler.jsonc` `name` and `services[].service` must match the actual Cloudflare Worker name used by Workers Builds for this repo

GitHub Actions deploy secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## File structure

### App router

- `app/layout.tsx`
  Root layout, metadata, and typography setup.
- `app/globals.css`
  Global Tailwind + theme token layer derived from the design output.
- `app/page.tsx`
  Main dashboard with hero, suggested loops, role tracks, improvement themes, and integration readiness.
- `app/profile/page.tsx`
  User summary, mastery view, and achievements.
- `app/coach/page.tsx`
  AI coach surface.
- `app/settings/page.tsx`
  Product settings page.
- `app/auth/sign-in/page.tsx`
  Firebase-auth-oriented sign-in shell.
- `app/practice/[scenarioId]/page.tsx`
  Dynamic interview practice route.
- `app/review/[scenarioId]/page.tsx`
  Dynamic review route for structured feedback.
- `app/api/health/route.ts`
  Small health/status endpoint exposing integration readiness.

### Shared app components

- `components/app/main-shell.tsx`
  Desktop sidebar and mobile bottom navigation for the main app surfaces.
- `components/app/status-grid.tsx`
  Shows Firebase, Gemini, ElevenLabs, and Mongo readiness on the dashboard.
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

- `data/scenarios.ts`
  Typed mock data for role tracks, scenarios, review payloads, profile data, and coach messages.
- `lib/utils.ts`
  Shared `cn()` utility.
- `lib/env.ts`
  Server-side env loading and readiness flags.
- `lib/firebase/client.ts`
  Firebase client bootstrap for future auth wiring.
- `lib/gemini.ts`
  Gemini request helper scaffold for scoring / feedback.
- `lib/elevenlabs.ts`
  ElevenLabs speech helper scaffold for interviewer voice playback.
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

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `MONGODB_URI`
- `MONGODB_DB_NAME`

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

Preview in the Workers runtime:

```bash
npm run preview
```

Deploy:

```bash
npm run deploy
```

## Verification completed

I verified the current repo by running:

- `npm install`
- `npm run build`
- `npm run cf-typegen`
- `npx opennextjs-cloudflare build`

Results:

- the Next.js production build passes
- Cloudflare env types generate successfully
- the OpenNext Cloudflare build successfully generates `.open-next/worker.js`

## Next implementation steps

The UI foundation is ready. The next real product work should be:

1. connect Firebase Auth flows to the sign-in surface
2. persist users, attempts, transcripts, and scores in MongoDB Atlas
3. wire microphone capture and transcript storage
4. call Gemini for interviewer turns, scoring, and structured feedback
5. call ElevenLabs for interviewer voice playback
6. replace mocked dashboard/profile data with user-specific data fetching
