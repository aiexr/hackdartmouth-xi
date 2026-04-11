import { NextRequest, NextResponse } from "next/server";

const LIVEAVATAR_API = "https://api.liveavatar.com";

export async function POST(req: NextRequest) {
  const heygenKey = process.env.HEYGEN_API_KEY;
  if (!heygenKey) {
    return NextResponse.json(
      { error: "HEYGEN_API_KEY not configured" },
      { status: 503 },
    );
  }

  const body = await req.json();
  const { mode = "video" } = body;

  if (mode === "video") {
    // FULL mode — LiveAvatar handles avatar + voice + STT + LLM + TTS
    const sessionBody = {
      mode: "FULL",
      avatar_id: process.env.HEYGEN_AVATAR_ID ?? "cd1d101c-9273-431b-8069-63beef736bec",
      avatar_persona: {
        context_id: process.env.HEYGEN_CONTEXT_ID ?? "30b7e11a-bc17-460c-8ec2-a0de663ef512",
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

    const data = await res.json();
    return NextResponse.json({ ...data, interviewMode: "video" });
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
