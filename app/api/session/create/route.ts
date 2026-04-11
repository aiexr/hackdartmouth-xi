import { NextRequest, NextResponse } from "next/server";

const LIVEAVATAR_API = "https://api.liveavatar.com";

const AVATAR_POOL = [
  { id: "cd1d101c-9273-431b-8069-63beef736bec", name: "Judy HR" },
  { id: "65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0", name: "June HR" },
  { id: "9650a758-1085-4d49-8bf3-f347565ec229", name: "Silas HR" },
  { id: "0930fd59-c8ad-434d-ad53-b391a1768720", name: "Dexter Lawyer" },
  { id: "513fd1b7-7ef9-466d-9af2-344e51eeb833", name: "Ann Therapist" },
  { id: "7b888024-f8c9-4205-95e1-78ce01497bda", name: "Shawn Therapist" },
  { id: "6e32f90a-f566-45be-9ec7-a5f6999ee606", name: "Judy Lawyer" },
  { id: "b6c94c07-e4e5-483e-8bec-e838d5910b7d", name: "Judy Teacher" },
];

const TONE_CONTEXTS: Record<string, string> = {
  friendly: "58af8f44-e220-4da2-af71-5628613ca96b",
  neutral: "30b7e11a-bc17-460c-8ec2-a0de663ef512",
  tough: "d7fef5ad-ba75-4a37-af5f-4c37c5f04ce6",
};

function pickRandomAvatar() {
  return AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
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

  if (mode === "video") {
    // FULL mode — LiveAvatar handles avatar + voice + STT + LLM + TTS
    const avatar = pickRandomAvatar();
    const sessionBody = {
      mode: "FULL",
      avatar_id: avatar.id,
      avatar_persona: {
        context_id: TONE_CONTEXTS[tone] ?? TONE_CONTEXTS.neutral,
        language: "en",
      },
      llm_configuration_id: process.env.HEYGEN_LLM_CONFIG_ID ?? "e7541a91-b99f-49ab-a3fa-5a4dea83a169",
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
    });
  }

  // CALL mode — return ElevenLabs agent config for direct connection
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
  });
}
