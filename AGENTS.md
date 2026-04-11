# AGENTS.md

## Pushing
When pushing to main, just do 
`git pull`

`git add .`

and commit your changes to main; rebase if needed
just dont slow down work. 

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

Agents must keep `roadmap.md` up to date when they add, complete, reprioritize, or materially change work in the repo. That means when a task has been completed say that by putting (Completed) next to it. 

## LLM call policy

When making any LLM call in this repo, route it through `lib/integrations/llm.ts`.

Do not call provider modules directly from app routes/components unless you are actively changing the integration layer itself.

`lib/integrations/llm.ts` is where provider selection, model override/fallback behavior, shared defaults, and optional JSON parsing are handled.

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


Project specific context:
LiveAvatar - docs.liveavatar.com - is a real-time AI avatar API that lets you spin up a talking, lifelike avatar in just a few lines of code. Great for AI tutors, support agents, training sims, companions - anything that benefits from a real human-feeling interaction. https://docs.liveavatar.com/ . Available credits: $100 https://heygen.notion.site/Hackathon-How-to-Build-with-LiveAvatar-API-334449792c6980e98a81cfebaa9e3bb0?source=copy_link .

ElevenLabs - https://elevenlabs.io/docs/overview/intro
Creator mode





AI Interview Prepper — Full Plan
Context
AI-powered interview prep for HackDartmouth XI. Face-to-face mock interviews with a realistic avatar, covering behavioral, technical, and system design. Post-interview grading + feedback, LeetSpeak-style.
Sponsors: LiveAvatar (HeyGen), ElevenLabs, Gemini

Core Pipeline
User speaks → ElevenLabs STT → Gemini 2.5 Flash → ElevenLabs TTS → LiveAvatar avatar → User

All three sponsors connected via the native ElevenLabs Agent Plugin for LiveAvatar.

Tech Stack
Layer
Tech
Why
Frontend
Next.js 14 (App Router) + TypeScript + Tailwind
Fast to build, SSR, great DX
Avatar
@heygen/liveavatar-web-sdk (LITE mode + ElevenLabs plugin)
Realistic lip-synced talking avatar
Voice + Conversation
ElevenLabs Conversational AI (WebSocket/WebRTC)
Bundles STT + TTS + LLM orchestration
LLM Brain
Gemini 2.5 Flash (via ElevenLabs agent config)
OR Chat.Dartmouth.edu for testing
Interview logic, questions, grading
Post-Interview Grading
Gemini API (direct, text-based) OR
Chat.Dartmouth.edu for testing
Structured evaluation of full transcript
Database
MongoDB Atlas (Mongoose ODM)
Free tier, flexible document schema
Auth
NextAuth.js (MongoDB adapter)
Google/GitHub OAuth
Deployment
TBD, possibly CloudFlare.
Zero-config Next.js deploys, free tier


Application Flow
1. Landing / Dashboard
Sign in via NextAuth.js (Google/GitHub OAuth)
Dashboard shows past interviews with LeetSpeak-style scores + progress chart
"Start Interview" button
2. Interview Setupvercel
Pick type: Behavioral / Technical / System Design / Custom (paste job description)
Pick difficulty: Easy / Medium / Hard
Optional: upload resume for personalized questions
3. Live Interview Session
Backend creates LiveAvatar session token (API key stays server-side)
Frontend initializes LiveAvatar SDK in LITE mode with ElevenLabs Agent Plugin
Avatar appears — interviewer introduces themselves
Real-time back-and-forth (5-8 questions, ~15-20 min)
Transcript captured via ElevenLabs events
4. Post-Interview Grading
Full transcript → LLM API for structured evaluation
Grading rubric (1-10 per dimension):
Behavioral: STAR structure, specificity, self-awareness, communication
Technical: correctness, problem-solving, thought process, optimization
Overall score + letter grade
Per-question feedback + "key moments" highlights

Routes
/                          → Landing page
/dashboard                 → Interview history, scores, progress
/interview/setup           → Pick type, difficulty, resume
/interview/session         → Live avatar interview (full screen)
/interview/[id]/results    → Grading + feedback

API Routes
POST /api/session/create   → LiveAvatar token + ElevenLabs agent
POST /api/interview/start  → Record interview start
POST /api/interview/end    → Receive transcript, trigger grading
GET  /api/interview/[id]   → Get results
GET  /api/interviews       → List past interviews


LiveAvatar + ElevenLabs Plugin Setup
Store ElevenLabs API key via LiveAvatar secrets endpoint (one-time)
Create ElevenLabs agent with Gemini 2.5 Flash + interview system prompt + voice
Start LiveAvatar session in LITE mode with avatar_id + ElevenLabs plugin config
Frontend renders avatar via @heygen/liveavatar-web-sdk
Listen for elevenlabs_agent_event for transcript data

ElevenLabs Agent System Prompts
Behavioral: "You are a senior hiring manager. Ask one question at a time. Probe depth with follow-ups. Evaluate STAR method..."
Technical: "You are a senior engineer. Present coding problems verbally. Ask candidate to explain approach before coding. Probe edge cases..."
System Design: "You are a staff engineer. Start with a broad problem, let the candidate drive, ask clarifying questions..."

Grading Implementation
Post-interview, send full transcript to Gemini API:
Returns JSON: {
  overall_score (1-100), letter_grade (A+ to F),
  dimensions: [{ name, score, feedback }],
  per_question: [{ question, answer_summary, score, feedback }],
  strengths: [string], improvements: [string],
  key_moments: [{ timestamp, type, description }]
}


MongoDB Schema (Mongoose)
Interview {
  userId: String (indexed),
  type: 'behavioral' | 'technical' | 'system_design',
  difficulty: 'easy' | 'medium' | 'hard',
  status: String,
  transcript: [{ role, content, timestamp }],
  overallScore: Number,
  letterGrade: String,
  gradingResult: Mixed,
  createdAt: Date,
  completedAt: Date
}


File Structure
hackdartmouth-xi/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing
│   │   ├── dashboard/page.tsx          # Interview history
│   │   ├── interview/
│   │   │   ├── setup/page.tsx          # Interview config
│   │   │   ├── session/page.tsx        # Live interview
│   │   │   └── [id]/results/page.tsx   # Feedback
│   │   └── api/
│   │       ├── session/create/route.ts
│   │       ├── interview/
│   │       │   ├── start/route.ts
│   │       │   ├── end/route.ts
│   │       │   └── [id]/route.ts
│   │       └── interviews/route.ts
│   ├── components/
│   │   ├── AvatarPlayer.tsx
│   │   ├── InterviewControls.tsx
│   │   ├── ScoreCard.tsx
│   │   ├── ProgressChart.tsx
│   │   └── TranscriptView.tsx
│   ├── lib/
│   │   ├── liveavatar.ts
│   │   ├── elevenlabs.ts
│   │   ├── gemini.ts
│   │   ├── mongodb.ts
│   │   └── prompts.ts
│   ├── models/
│   │   ├── Interview.ts
│   │   └── User.ts
│   └── types/
│       └── interview.ts
├── .env.local
├── package.json
├── tailwind.config.ts
└── next.config.ts


Deployment
Push repo to GitHub
Connect repo on provider.
Add env vars: MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL, HEYGEN_API_KEY, ELEVENLABS_API_KEY, GEMINI_API_KEY, CHAT_DARTMOUTH_API_KEY
Deploy — every git push auto-deploys

Build Order (hackathon speed)
Scaffold — create-next-app + Tailwind + MongoDB + NextAuth
Avatar + conversation — LiveAvatar + ElevenLabs plugin (the core demo)
Interview flow — Setup page → live session
Grading — Gemini evaluation + results page
Dashboard — History, scores, progress chart
Deploy to Provider — connect GitHub, add env vars, done
Polish — Landing page, resume upload, custom job descriptions
