import { NextResponse } from "next/server";
import { getOptionalServerSession } from "@/lib/auth";
import { ll } from "@/lib/integrations/llm";

type ModerationTurn = {
  role: "user" | "interviewer";
  content: string;
};

function parseTranscript(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [] as ModerationTurn[];
  }

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const role = (entry as { role?: unknown }).role;
      const content = (entry as { content?: unknown }).content;

      if ((role !== "user" && role !== "interviewer") || typeof content !== "string") {
        return null;
      }

      const trimmed = content.trim();
      if (!trimmed) {
        return null;
      }

      return {
        role,
        content: trimmed,
      };
    })
    .filter((entry): entry is ModerationTurn => Boolean(entry))
    .slice(-6);
}

function parseDecision(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return { shouldEnd: false, reason: "" };
  }

  const shouldEnd = (raw as { shouldEnd?: unknown }).shouldEnd === true;
  const reason = typeof (raw as { reason?: unknown }).reason === "string"
    ? (raw as { reason: string }).reason.trim()
    : "";

  return {
    shouldEnd,
    reason,
  };
}

const MODERATION_SYSTEM_PROMPT = `You are a safety moderator for a live mock interview.

Decide whether the interview should end immediately based on the user's latest message and recent transcript context.

End the interview only for clear cases such as:
- hateful or discriminatory language
- targeted harassment or abuse
- threats or intimidation
- sexual harassment
- repeated explicit disrespect toward the interviewer

Do not end the interview for:
- normal frustration
- mild profanity not directed at a person
- disagreement
- discussion of harmful language in a neutral/quoted/academic way
- awkward phrasing that is not clearly abusive

Return ONLY valid JSON with exactly this shape:
{
  "shouldEnd": true,
  "reason": "A brief goodbye first, then a clear sentence that the interview is ending because respectful language is required."
}

If the interview should continue, return:
{
  "shouldEnd": false,
  "reason": ""
}`;

export async function POST(request: Request) {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { latestMessage?: unknown; transcript?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const latestMessage =
    typeof body.latestMessage === "string" ? body.latestMessage.trim() : "";
  const transcript = parseTranscript(body.transcript);

  if (!latestMessage) {
    return NextResponse.json({ shouldEnd: false, reason: "" });
  }

  const prompt = [
    transcript.length
      ? `Recent transcript:\n${transcript
          .map((turn) => `${turn.role === "user" ? "User" : "Interviewer"}: ${turn.content}`)
          .join("\n")}`
      : "",
    `Latest user message: ${latestMessage}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const result = await ll(prompt, {
      systemPrompt: MODERATION_SYSTEM_PROMPT,
      parseJson: true,
      temperature: 0,
      maxTokens: 180,
    });

    return NextResponse.json(parseDecision(result.json));
  } catch {
    return NextResponse.json({ shouldEnd: false, reason: "" });
  }
}
