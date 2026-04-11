# Roadmap

This file tracks the next implementation work for the repo, ordered from highest priority to lowest priority.
Agents must update this file when they complete work here or materially change scope, sequencing, or priorities.

**When you finish a roadmap task, delete its line from this file in the same change that implements it. Do not leave items tagged `(Completed)`.**

## High Priority

_All current high-priority items shipped. Add the next blocker here._

## Medium Priority

1. Integrate ElevenLabs voice playback into interview sessions so interviewer prompts can be spoken instead of only rendered as text.
2. Add robust loading, empty, and error states across practice, review, auth, and settings flows so partially configured integrations fail gracefully.
3. Add automated verification for the critical paths: auth bootstrap, API health, scenario routing, and Cloudflare deployment workflow behavior.

## Low Priority

1. Add scenario authoring/admin tooling or a structured content pipeline so prompts, rubrics, and follow-ups are not maintained only as hardcoded TypeScript data.
2. Improve observability with request logging and basic analytics for session starts, completions, scoring failures, and deployment health.
3. Refine the settings surface to support real user preferences for voice, feedback style, and practice defaults once persistence is in place.
4. Tighten docs across `README.md` and deployment instructions so local setup, environment variables, and Cloudflare/GitHub responsibilities are unambiguous for new contributors.
