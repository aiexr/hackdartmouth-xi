# AGENTS.md

## Pushing

When pushing to main, just do
`git pull --rebase`

`git add .`

and commit your changes to main; rebase if needed.
Just don't slow down work.

**Before pushing:** if the change you just made completes a task listed in `roadmap.md`, delete that line from the active priority list in the same commit. Do not tag it `(Completed)` and leave it — remove the entry.

## Designing

If you are designing UI/UX refer to design.md

## Purpose

This repository is designed for fast execution by coding agents working from short human prompts.

The agent should optimize for:
- shipping useful changes quickly
- making safe local decisions without excessive back-and-forth
- minimizing breakage as the project grows
- reducing coordination and merge pain through scoped edits

The agent is expected to act, not stall.

---

## Operating principle

Given a human prompt, make the **smallest high-leverage implementation** that satisfies the request while preserving existing behavior.

Prefer:
- fast, local, reversible decisions
- additive changes over rewrites
- completing a narrow slice fully
- working code over ideal architecture
- consistency with existing repo patterns

Do not prefer:
- large speculative refactors
- repo-wide cleanup
- broad redesigns
- "improving" unrelated code
- introducing churn for elegance

---

## Default behavior

When a human gives a prompt, the agent should:

1. infer the intended outcome
2. identify the smallest reasonable scope that achieves it
3. make the change directly
4. avoid unrelated edits
5. preserve existing working flows
6. summarize what changed and any risks

If the prompt is underspecified, do **not** stop unless blocked.
Choose the most conservative reasonable interpretation and proceed.

---

## Decision rules

### 1. Scope narrowly
A prompt should usually result in changes to:
- one feature
- one bug
- one route
- one component group
- one backend path

Do not expand scope unless required for correctness.

### 2. Be locally correct
Fix the problem at the closest sensible layer.
Do not restructure distant parts of the system unless necessary.

### 3. Preserve contracts
Assume these are high-risk unless explicitly requested:
- shared types
- auth/session logic
- database schema
- API contracts
- routing structure
- environment/config
- deployment files
- package dependencies
- global styles
- shared UI primitives

If touching one of these is necessary:
- keep the change minimal
- preserve backward compatibility where possible
- clearly note it in the summary

### 4. Prefer additive changes
Prefer:
- new helper
- new component
- small wrapper
- local patch
over:
- replacing shared abstractions
- renaming broadly used files
- rewriting large modules

### 5. Avoid unrelated cleanup
Do not fix lint, formatting, naming, or architecture issues outside the task unless they block completion.

### 6. Prefer obvious code
During fast-moving development, choose readable and predictable solutions over clever abstractions.

---

## Behavior under ambiguity

If the prompt is vague, use this order:

1. existing repo patterns
2. minimal implementation
3. lowest-risk assumption
4. fastest shippable version

If multiple interpretations are possible, choose the one with:
- the smallest blast radius
- the clearest user-visible value
- the least disruption to current behavior

---

## Behavior as project complexity increases

### Late stage / demo hardening (current stage)
Optimize for:
- not breaking anything
- bugfixes and polish
- safe, testable changes only

Avoid:
- refactors
- dependency swaps
- changes to shared contracts unless essential

As the repo grows, the agent must become **more conservative in scope**, not slower in execution.

---

## File-touch policy

The agent should minimize the number of touched files.

Good default:
- 1 to 4 files
- one subsystem
- one observable outcome

Before editing many files, ask internally:
- Is each file necessary?
- Can this be done more locally?
- Am I changing shared behavior unnecessarily?

If yes, reduce scope.

---

## Safety constraints

The agent must not:
- rewrite large files without necessity
- change unrelated modules
- silently alter public/shared behavior
- add new dependencies without strong reason
- perform global formatting passes
- rename broadly used symbols/files casually
- mix multiple objectives into one patch
- "clean up" neighboring code just because it looks bad

The agent may:
- add short clarifying comments where useful
- duplicate a small amount of code to avoid destabilizing shared abstractions
- leave TODOs only when they directly matter to the task

## Roadmap maintenance

Agents must keep `roadmap.md` up to date when they add, complete, reprioritize, or materially change work in the repo.

**When you finish a roadmap task, DELETE that line from `roadmap.md` in the same commit that implements it.** This is mandatory, not optional.

A task is not done until the roadmap entry for it has been deleted.

## Agent doc maintenance

When project context, routes, APIs, deployment setup, or core workflows change materially, agents must update `AGENTS.md` in the same task/PR so instructions stay accurate.

## LLM call policy

When making any LLM call in this repo, route it through `lib/integrations/llm.ts`.

Do not call provider modules directly from app routes/components unless you are actively changing the integration layer itself.

`lib/integrations/llm.ts` is where provider selection, model override/fallback behavior, shared defaults, and optional JSON parsing are handled.

`ll()` in `lib/integrations/llm.ts` is text-only and does not accept file objects/binary payloads directly.
For uploaded files, extract text first (for example via `lib/document-extract.ts`) and then pass the extracted text context into the `ll()` prompt.

---

## Priority order

Optimize in this order:

1. preserve working behavior
2. satisfy the human request
3. keep scope tight
4. ship quickly
5. improve code quality where cheap

Not the reverse.

---

## Fallback rule

If unsure how to proceed:
- do the smallest reasonable thing that moves the feature forward
- avoid shared-contract churn
- preserve existing behavior
- leave the codebase in a working, understandable state

When forced to choose, prefer **safe speed over ambitious redesign**.

---

## Project context (current state)

This repo is a Next.js 16 App Router app with routes rooted at `app/` (not `src/app`).

### Styling stack
- Tailwind CSS v4 with DaisyUI plugin (themes: `corporate`, `dark`)
- Theme tokens defined in `app/globals.css` as CSS custom properties
- DaisyUI classes (`bg-base-100`, `btn`, `card`, `border-base-300`, etc.) are the primary styling vocabulary
- shadcn/ui primitives in `components/ui/` for some shared components
- All border radii are `rounded-none` / `0px` — sharp edges everywhere

### Auth
- NextAuth with Google OAuth, JWT sessions
- No standalone sign-in page — unauthenticated users see a landing page at `/` with a sign-in button
- Session available via `getOptionalServerSession()` server-side and `useSession()` client-side

### Data
- MongoDB Atlas for interviews, user profiles, metrics
- Scenario bank + LeetCode problems in `data/`
- Resume text extracted and stored on user profile (no raw files persisted)

### Integrations
- LiveAvatar (HeyGen) — real-time AI avatar for video interview mode
- ElevenLabs — voice call mode for interviews
- LLM grading — OpenAI-compatible and Gemini providers via `lib/integrations/llm.ts`

### Deployment
- Cloudflare Workers via OpenNext (`open-next.config.ts`, `wrangler.jsonc`)
- Use package scripts (`preview`, `deploy`) for OpenNext/Cloudflare workflows

### Page routes
- `/` — dashboard (authenticated) or landing page (unauthenticated)
- `/practice` — scenario picker with round tabs, drill-down navigation, LeetCode browser
- `/practice/[scenarioId]` — live interview session (video/call modes, code editor, whiteboard)
- `/practice/lc/[slug]` — LeetCode-sourced interview session (can be technical, behavioral, or system-design mode)
- `/profile` — user profile, resume upload, mastery stats
- `/coach` — AI coach chat
- `/review/[scenarioId]` — post-interview feedback and rubric breakdown
- `/settings` — user preferences
- `/llm` — internal LLM sandbox (localhost/dev only; blocked in prod)

### API routes
- `POST /api/interview/start` — create a new interview
- `POST /api/interview/end` — complete interview + LLM grading
- `GET /api/interview/[id]` — get single interview
- `GET/POST /api/interview/[id]/transcript` — read/append transcript
- `GET /api/interviews` — list user's interviews
- `POST /api/coach` — AI coach chat endpoint (limited to 10 messages/day per logged-in user)
- `GET /api/leetcode/problems` — browse LeetCode problems
- `GET /api/leetcode/problem/[slug]` — single LeetCode problem detail
- `POST /api/leetcode/scenario` — generate a scenario from a LeetCode problem
- `POST /api/session/create` — LiveAvatar/ElevenLabs session tokens
- `POST /api/session/setup-secret` — ElevenLabs API key setup
- `GET/POST /api/user/profile` — read/update user profile
- `POST /api/user/profile/resume` — resume upload + text extraction
- `POST /api/profile/context` — profile context for grading
- `POST /api/document/extract` — extract text from PDF/DOCX
- `POST /api/llm/test` — LLM sandbox test
- `GET /api/health` — integration readiness check
- `GET /api/init` — app initialization
- `NextAuth handler at /api/auth/[...nextauth]`

### Common runtime envs
- NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- MONGODB_URI, MONGODB_DB_NAME
- LLM_PROVIDER (`openai` or `gemini`), OPENAI_API_KEY, OPENAI_MODEL, GEMINI_API_KEY, GEMINI_MODEL
- ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
- HEYGEN_API_KEY
