# AGENTS.md

## Pushing
When pushing to main, just do 
`git pull --rebase`

`git add .`

and commit your changes to main; rebase if needed
just dont slow down work.

**Before pushing:** if the change you just made completes a task listed in `roadmap.md`, delete that line from the active priority list in the same commit. Do not tag it `(Completed)` and leave it — remove the entry. This applies every time you finish a roadmap task, not just when the human reminds you.

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
- “improving” unrelated code
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

Examples:
- “add login error state” → add visible error handling in the current login flow, not a new auth architecture
- “make dashboard nicer” → improve spacing/text/loading states in the dashboard only, not redesign the whole app
- “add persistence” → persist the relevant feature using the simplest existing storage pattern in the repo

If multiple interpretations are possible, choose the one with:
- the smallest blast radius
- the clearest user-visible value
- the least disruption to current behavior

---

## Behavior as project complexity increases

### Early stage
Optimize for:
- speed
- direct implementation
- shipping core functionality

Acceptable:
- some duplication
- local shortcuts
- thin abstractions

### Mid stage
Optimize for:
- preserving working flows
- limiting changes to owned/local surfaces
- protecting shared contracts

Prefer:
- narrower edits
- fewer touched files
- stronger compatibility

### Late stage / demo hardening
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

## Human prompt handling

Interpret prompts as requests for implementation, not discussion, unless the human explicitly asks for planning.

### If the prompt asks for a feature
Implement the thinnest complete version that fits current patterns.

### If the prompt asks for a bugfix
Patch the smallest root cause you can identify confidently.

### If the prompt asks for improvement
Choose the highest-impact local improvement, not a broad rewrite.

### If the prompt asks for refactor
Only refactor the portion directly involved in the requested outcome.

### If the prompt is broad
Carve out the smallest useful shippable slice and do that.

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
- “clean up” neighboring code just because it looks bad

The agent may:
- add short clarifying comments where useful
- duplicate a small amount of code to avoid destabilizing shared abstractions
- leave TODOs only when they directly matter to the task

## Roadmap maintenance

Agents must keep `roadmap.md` up to date when they add, complete, reprioritize, or materially change work in the repo.

**When you finish a roadmap task, DELETE that line from `roadmap.md` in the same commit that implements it.** This is mandatory, not optional.

- Do NOT tag items `(Completed)` and leave them in High / Medium / Low Priority. Delete the line outright.
- Do NOT defer the removal to a follow-up commit. The removal IS part of the task.
- If you notice stale `(Completed)` items while working on the roadmap, delete them in the same change — they are bugs, not history.
- Before pushing, re-read `roadmap.md` and confirm your finished item is gone and no `(Completed)` tags remain.

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

## Preferred implementation style

- use existing patterns first
- keep interfaces stable
- make changes easy to review
- keep logic close to where it is used
- favor predictable control flow
- avoid novelty unless necessary

When choosing between two valid implementations, prefer:
1. less shared surface touched
2. easier rollback
3. lower cognitive overhead
4. less coordination required

---

## Verification standard

After making changes, the agent should verify at the cheapest meaningful level available.

Minimum:
- code is internally consistent
- changed flow is plausibly correct
- imports/types/usages line up

Preferred:
- run focused tests if available
- run the relevant app path if cheap
- verify the main affected behavior

Do not spend excessive time on exhaustive validation during rapid iteration unless the area is critical.

---

## Output format

After completing a task, provide:

1. what was changed
2. files touched
3. any assumptions made
4. any risky/shared contract changes
5. quick verification steps

Keep the summary short and implementation-focused.

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

---

## Default instruction for any agent in this repo

You are a fast implementation agent working in a shared hackathon-style repository.

Given a human prompt:
- infer the intended outcome
- choose the smallest safe implementation
- avoid unrelated edits
- preserve existing behavior
- minimize touched files
- avoid broad rewrites
- act without unnecessary clarification
- summarize changes and risks briefly

When forced to choose, prefer **safe speed over ambitious redesign**.


Project specific context (current state)

LiveAvatar - docs.liveavatar.com - is a real-time AI avatar API that lets you spin up a talking, lifelike avatar in just a few lines of code. Great for AI tutors, support agents, training sims, companions - anything that benefits from a real human-feeling interaction. https://docs.liveavatar.com/ . Available credits: $100 https://heygen.notion.site/Hackathon-How-to-Build-with-LiveAvatar-API-334449792c6980e98a81cfebaa9e3bb0?source=copy_link .

ElevenLabs - https://elevenlabs.io/docs/overview/intro
Creator mode

This repo is an App Router Next.js app with routes rooted at `app/` (not `src/app`).

Overall plan (based on current app shape)
- Auth + entry: sign in at `/auth/sign-in`, then navigate from `/`.
- Practice loop: scenarios live under `/practice` and `/practice/[scenarioId]`.
- Live coaching and voice surfaces: `/coach` plus app components in `components/app/`.
- Review and progression: results/feedback under `/review/[scenarioId]` and user state pages under `/profile` and `/settings`.
- Integration test surface: `/llm` for LLM wiring and document extraction checks.

Current page routes
- /
- /auth/sign-in
- /coach
- /llm
- /practice
- /practice/[scenarioId]
- /profile
- /review/[scenarioId]
- /settings

Current API routes
- POST /api/session/create
- POST /api/session/setup-secret
- GET /api/health
- POST /api/llm/test
- POST /api/document/extract
- POST /api/interview/start
- POST /api/interview/end
- GET /api/interview/[id]
- GET/POST /api/interview/[id]/transcript
- GET /api/interviews
- NextAuth handler at /api/auth/[...nextauth]

LLM and document flow
- Route all LLM calls through `lib/integrations/llm.ts`.
- Provider integrations live under `lib/integrations/`.
- Uploaded files should be text-extracted via `lib/document-extract.ts` before prompt composition.

Deployment
- Cloudflare/OpenNext is configured (`open-next.config.ts`, `wrangler.jsonc`).
- Use package scripts (`preview`, `deploy`) for OpenNext/Cloudflare workflows.

Common runtime envs
- NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID

Profile uploads now persist as well:

- the profile editor at `/profile` accepts a resume upload
- the file is stored in Cloudflare R2 through `RESUME_BUCKET`
- extracted text and resume metadata are saved on the user profile for reuse in later interview grading
- the profile page at `/profile` shows the stored resume and offers a download link
- GOOGLE_CLIENT_SECRET
- MONGODB_URI
- MONGODB_DB_NAME
- OPENAI_API_KEY
- OPENAI_MODEL
- GEMINI_API_KEY
- GEMINI_MODEL
- LLM_PROVIDER
- `RESUME_BUCKET`
- ELEVENLABS_API_KEY
- ELEVENLABS_VOICE_ID
- HEYGEN_API_KEY
