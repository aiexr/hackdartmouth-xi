# Deployment

https://leetspeak.live/

---

# LeetSpeak

Mock interview practice that actually interviews you back.

LeetSpeak gives you realistic behavioral, technical, and system design interview rounds with AI-powered feedback. Upload your resume, pick a scenario, talk through your answer, and get graded on a real rubric — not a generic "good job."

## What it does

**Practice interviews across three categories:**
- **Behavioral** — "Tell me about yourself," leadership stories, conflict resolution
- **Technical** — Coding problems with a live Monaco editor, LeetCode integration, BrainStellar-backed quant problems, diagram whiteboard (tldraw)
- **System design** — Architecture discussions with follow-up questions

**AI grading and coaching:**
- Interviews are graded by LLM (OpenAI or Gemini) against scenario-specific rubrics
- Resume text is extracted and fed into grading context so feedback is personalized
- A separate AI Coach chat lets you ask questions, get tips, or debrief between rounds

**Track your progress:**
- Dashboard shows interview history, scores, streaks, and improvement areas
- Profile page displays mastery across different tracks and difficulty levels
- Review pages break down each attempt: score, rubric breakdown, strengths, areas to improve

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, DaisyUI, shadcn/ui primitives
- **Auth:** NextAuth.js with Google OAuth (JWT sessions)
- **Database:** MongoDB Atlas — interview persistence, user profiles, metrics
- **LLM:** Provider abstraction supporting OpenAI-compatible endpoints and Google Gemini
- **Code editor:** Monaco Editor (VS Code's editor)
- **Whiteboard:** tldraw for diagram/system design sketches
- **Voice/Avatar:** HeyGen LiveAvatar + ElevenLabs integration
- **Document parsing:** pdf-text-extract + mammoth (PDF, DOCX resume upload)
- **Deployment:** Cloudflare Workers via OpenNext

## Local development

```bash
npm install
npm run dev
```

Copy `.dev.vars.example` to `.dev.vars` and fill in your keys. The app degrades gracefully when integrations are missing — auth, LLM, and DB features just won't be available.

### Key env vars

| Variable | What it's for |
|---|---|
| `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `MONGODB_URI`, `MONGODB_DB_NAME` | Interview storage + metrics |
| `LLM_PROVIDER` (`openai` or `gemini`) | Which LLM backend to use |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | OpenAI-compatible provider |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Google Gemini provider |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | Voice synthesis |
| `HEYGEN_API_KEY` | LiveAvatar sessions |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Next.js production build |
| `npm run preview` | Build + preview on Cloudflare Workers locally |
| `npm run deploy` | Build + deploy to Cloudflare Workers |

## Architecture at a glance

```
app/                    → Next.js App Router pages and API routes
  (shell)/              → Main app layout (sidebar nav, auth gating)
    practice/           → Scenario picker + live interview sessions
    profile/            → User profile, resume upload, mastery stats
    coach/              → AI coach chat
  api/
    interview/          → Start, end, transcript, grading endpoints
    session/            → LiveAvatar/ElevenLabs session management
    auth/               → NextAuth handler
components/app/         → Feature components (practice session, coach, settings)
components/ui/          → Reusable UI primitives (button, card, badge, etc.)
data/                   → Scenario bank, LeetCode problems, fixtures
lib/                    → Auth config, MongoDB client, LLM router, doc extraction
lib/integrations/       → LLM provider implementations (OpenAI, Gemini)
```

All LLM calls route through `lib/integrations/llm.ts` for centralized provider selection and fallback handling.

## Team

Built at HackDartmouth XI.

## Content Credit

Quant problem prompts in the practice flow are sourced from the [BrainStellar](https://github.com/rudradesai200/BrainStellar) repository by GitHub user [`rudradesai200`](https://github.com/rudradesai200).
