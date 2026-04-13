import { getOptionalServerSession } from "@/lib/auth";
import { UserModel } from "@/lib/models";
import { ll } from "@/lib/integrations/llm";

type CoachHistoryTurn = {
  role: "user" | "coach";
  text: string;
};

const COACH_SYSTEM_PROMPT = `You are a senior interview coach. You give specific, actionable feedback on resumes and interview preparation.

Rules:
- Be direct and concrete. No generic advice.
- When reviewing a resume, call out specific lines or sections that are weak and explain why.
- Suggest rewrites, not just criticism.
- Keep responses focused and under 300 words unless the user asks for more detail.
- If no resume is available, still help with general interview questions.
- Only ask the user to upload a resume when they request personalized resume feedback.
- If the user sends a short follow-up (for example: "hey", "why", "what do you mean"), respond naturally based on recent chat context.
- Ask at most one clarifying question when the user message is ambiguous.
- Do not assume the user pasted a resume or class reflection unless it appears in the latest user message or explicit resume context.
- Ignore incorrect assumptions from prior assistant messages.
- Use Markdown formatting (headings, lists, tables) when it improves readability.
- Always respond in plain conversational text, never JSON.`;

const COACH_DAILY_MESSAGE_LIMIT = 10;
const COACH_QUOTA_TIME_ZONE = "America/New_York";

function getCoachQuotaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COACH_QUOTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function parseCoachHistory(rawHistory: unknown) {
  if (!Array.isArray(rawHistory)) {
    return [] as CoachHistoryTurn[];
  }

  return rawHistory
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const role = (item as { role?: unknown }).role;
      const text = (item as { text?: unknown }).text;

      if ((role !== "user" && role !== "coach") || typeof text !== "string") {
        return null;
      }

      const trimmedText = text.trim();
      if (!trimmedText) {
        return null;
      }

      return {
        role,
        text: trimmedText,
      };
    })
    .filter((item): item is CoachHistoryTurn => Boolean(item))
    .slice(-8);
}

function tryParseCoachReply(candidate: string) {
  try {
    const parsed = JSON.parse(candidate) as {
      reply?: unknown;
      content?: unknown;
      message?: unknown;
      error?: unknown;
      text?: unknown;
    };

    const fields: Array<unknown> = [
      parsed.reply,
      parsed.content,
      parsed.message,
      parsed.error,
      parsed.text,
    ];

    for (const field of fields) {
      if (typeof field === "string" && field.trim()) {
        return field.trim();
      }
    }
  } catch {
    return null;
  }

  return null;
}

function extractLeadingJsonObject(text: string) {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("{")) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < trimmed.length; i += 1) {
    const char = trimmed[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return trimmed.slice(0, i + 1);
      }
    }
  }

  return null;
}

function normalizeCoachReply(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "I can help with interview prep or resume feedback. Tell me what you'd like to work on.";
  }

  const directJsonReply = tryParseCoachReply(trimmed);
  if (directJsonReply) {
    return directJsonReply;
  }

  const leadingJson = extractLeadingJsonObject(trimmed);
  if (leadingJson) {
    const leadingJsonReply = tryParseCoachReply(leadingJson);
    if (leadingJsonReply) {
      return leadingJsonReply;
    }

    const malformedSingleString = leadingJson.match(/^\{\s*"([\s\S]+)"\s*\}$/);
    if (malformedSingleString?.[1]) {
      return malformedSingleString[1].trim();
    }
  }

  return trimmed;
}

export async function POST(request: Request) {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { message?: string; action?: string; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const history = parseCoachHistory(body.history);

  if (!message && !body.action) {
    return Response.json({ error: "Message or action required" }, { status: 400 });
  }

  const quotaDateKey = getCoachQuotaDateKey(new Date());
  let reservedCoachQuota = false;

  try {
    const quota = await UserModel.consumeCoachMessage(
      session.user.email,
      quotaDateKey,
      COACH_DAILY_MESSAGE_LIMIT,
    );

    if (!quota.allowed) {
      return Response.json(
        {
          error: `Daily LeetCoach limit reached. You can send ${COACH_DAILY_MESSAGE_LIMIT} messages per day.`,
          remainingMessagesToday: quota.remaining,
        },
        { status: 429 },
      );
    }

    reservedCoachQuota = true;

    const user = await UserModel.getUserByEmail(session.user.email);
    const resumeText = user?.resumeExtractedText?.trim() || null;

    let prompt: string;
    const historyBlock = history.length
      ? `Recent conversation:\n${history
          .map((turn) => `${turn.role === "coach" ? "Coach" : "User"}: ${turn.text}`)
          .join("\n")}`
      : "";

    if (body.action === "resume-review") {
      if (!resumeText) {
        return Response.json(
          {
            reply:
              "I don't see a resume on your profile yet. Head to your Profile page and upload a PDF or DOCX first, then come back and I'll review it.",
            remainingMessagesToday: quota.remaining,
          },
        );
      }

      prompt = [
        historyBlock,
        "Latest user request: Review my resume.",
        `The user wants a resume review. Here is their resume text:\n\n---\n${resumeText}\n---\n\nGive a thorough review: identify the strongest parts, the weakest parts, and give 3-5 specific rewrite suggestions for the weakest lines. Be concrete — quote the original text and show the improved version.`,
      ]
        .filter(Boolean)
        .join("\n\n");
    } else {
      const contextBlock = resumeText
        ? `\n\nFor context, here is the user's resume:\n---\n${resumeText}\n---\n`
        : "\n\nResume status: The user has not uploaded a resume yet. Provide general interview coaching unless they ask for personalized resume feedback.";

      prompt = [
        historyBlock,
        `Latest user message: ${message}`,
        contextBlock,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    const result = await ll(prompt, {
      systemPrompt: COACH_SYSTEM_PROMPT,
      temperature: 0.4,
      maxTokens: 2000,
    });

    return Response.json({
      reply: normalizeCoachReply(result.content),
      remainingMessagesToday: quota.remaining,
    });
  } catch (error) {
    if (reservedCoachQuota) {
      await UserModel.releaseCoachMessage(session.user.email, quotaDateKey).catch((releaseError) => {
        console.error("Failed to release LeetCoach quota after error:", releaseError);
      });
    }
    console.error("Coach API error:", error);
    const message = error instanceof Error ? error.message : "Coach request failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
