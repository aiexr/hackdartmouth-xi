import { NextRequest, NextResponse } from "next/server";
import { getOptionalServerSession } from "@/lib/auth";
import {
  generatedInterviewers,
  getInterviewerById,
  getInterviewerByName,
} from "@/lib/interviewers";
import { UserModel } from "@/lib/models";

const LIVEAVATAR_API = "https://api.liveavatar.com";

const TONE_CONTEXTS: Record<string, string> = {
  friendly: "58af8f44-e220-4da2-af71-5628613ca96b",
  neutral: "30b7e11a-bc17-460c-8ec2-a0de663ef512",
  tough: "d7fef5ad-ba75-4a37-af5f-4c37c5f04ce6",
};

function summarizeResumeText(resumeText: string | null | undefined) {
  if (!resumeText) {
    return "";
  }

  return resumeText.replace(/\s+/g, " ").trim().slice(0, 1200);
}

function summarizeCandidateFirstName(name: string | null | undefined) {
  if (!name) {
    return "";
  }

  const normalized = name.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  return normalized.split(" ")[0]?.slice(0, 80) ?? "";
}

export async function POST(req: NextRequest) {
  const heygenKey = process.env.HEYGEN_API_KEY;
  if (!heygenKey) {
    return NextResponse.json(
      { error: "HEYGEN_API_KEY not configured" },
      { status: 503 },
    );
  }

  const rawBody: unknown = await req.json();
  const body =
    rawBody && typeof rawBody === "object"
      ? (rawBody as Record<string, unknown>)
      : {};
  const mode = body.mode === "call" ? "call" : "video";
  const tone = typeof body.tone === "string" ? body.tone : "neutral";
  const interviewerId =
    typeof body.interviewerId === "string" ? body.interviewerId.trim() : "";
  const interviewerName =
    typeof body.interviewerName === "string" ? body.interviewerName.trim() : "";
  const session = await getOptionalServerSession();
  const user = session?.user?.email ? await UserModel.getUserByEmail(session.user.email) : null;
  const resumeContext = summarizeResumeText(user?.resumeExtractedText);
  const candidateName = summarizeCandidateFirstName(
    typeof session?.user?.name === "string" ? session.user.name : user?.name,
  );

  if (mode === "video") {
    const interviewer = interviewerId
      ? getInterviewerById(interviewerId)
      : getInterviewerByName(interviewerName);
    const fallbackInterviewer = generatedInterviewers[0] ?? null;
    const resolvedInterviewer = interviewer ?? fallbackInterviewer;
    const avatar = resolvedInterviewer?.liveAvatar;

    if (!avatar) {
      return NextResponse.json(
        { error: "No LiveAvatar interviewer is configured" },
        { status: 500 },
      );
    }

    const sessionBody = {
      mode: "FULL",
      avatar_id: avatar.id,
      avatar_persona: {
        ...(avatar.defaultVoice?.id ? { voice_id: avatar.defaultVoice.id } : {}),
        context_id: TONE_CONTEXTS[tone] ?? TONE_CONTEXTS.neutral,
        language: "en",
      },
      llm_configuration_id:
        process.env.HEYGEN_LLM_CONFIG_ID ?? "e7541a91-b99f-49ab-a3fa-5a4dea83a169",
    };

    const res = await fetch(`${LIVEAVATAR_API}/v1/sessions/token`, {
      method: "POST",
      headers: {
        "X-API-KEY": heygenKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionBody),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: "Failed to create video session", details: err },
        { status: res.status },
      );
    }

    const rawData: unknown = await res.json();
    const data =
      rawData && typeof rawData === "object"
        ? (rawData as Record<string, unknown>)
        : {};
    return NextResponse.json({
      ...data,
      interviewMode: "video",
      avatarName: avatar.name,
      avatarPreviewUrl: avatar.previewUrl ?? null,
      avatarVoiceName: avatar.defaultVoice?.name ?? null,
      candidateName,
      resumeContext,
    });
  }

  const elevenLabsAgentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  if (!elevenLabsAgentId) {
    return NextResponse.json(
      { error: "ELEVENLABS_AGENT_ID not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    interviewMode: "call",
    agentId: elevenLabsAgentId,
    candidateName,
    resumeContext,
  });
}
