# Roadmap

This file tracks the next implementation work for the repo, ordered from highest priority to lowest priority.
Agents must update this file when they complete work here or materially change scope, sequencing, or priorities.

## High Priority

1. Implement real Firebase authentication flows on `/auth/sign-in` and gate user-specific routes behind an actual session instead of placeholder buttons and env-readiness text.
2. Persist practice attempts, transcripts, scores, and review history in MongoDB so sessions survive refreshes and power the profile and review surfaces with real data.
3. Replace the mocked practice-session controls with actual audio capture, live transcript updates, and step progression tied to recorded interview responses.
4. Wire Gemini scoring into the practice-to-review flow so `/review/[scenarioId]` is generated from a real transcript and rubric evaluation instead of static fixture data.
5. Harden the deployment path by simplifying the GitHub Actions and Cloudflare setup, removing duplicate deploy surfaces, and making the final deployment URL behavior explicit and reliable.

## Medium Priority

1. Add server-side API routes for creating attempts, appending transcript turns, requesting AI scoring, and reading prior sessions so UI state is not trapped in client-only components.
2. Build a real user progress model for dashboard, weekly goals, and profile stats so those pages reflect stored completion data instead of fixed mock percentages.
3. Integrate ElevenLabs voice playback into interview sessions so interviewer prompts can be spoken instead of only rendered as text.
4. Add robust loading, empty, and error states across practice, review, auth, and settings flows so partially configured integrations fail gracefully.
5. Add automated verification for the critical paths: auth bootstrap, API health, scenario routing, and Cloudflare deployment workflow behavior.

## Low Priority

1. Expand the scenario catalog in `data/scenarios.ts` so each track has enough breadth to support repeated use without obvious repetition.
2. Add scenario authoring/admin tooling or a structured content pipeline so prompts, rubrics, and follow-ups are not maintained only as hardcoded TypeScript data.
3. Improve observability with request logging and basic analytics for session starts, completions, scoring failures, and deployment health.
4. Refine the settings surface to support real user preferences for voice, feedback style, and practice defaults once persistence is in place.
5. Tighten docs across `README.md` and deployment instructions so local setup, environment variables, and Cloudflare/GitHub responsibilities are unambiguous for new contributors.
