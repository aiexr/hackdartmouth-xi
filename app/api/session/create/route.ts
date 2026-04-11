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

  const body = (await req.json()) as {
    avatarId?: string;
    elevenlabsSecretId?: string;
    elevenlabsAgentId?: string;
  };
  const {
    avatarId = process.env.HEYGEN_AVATAR_ID ?? "default",
    elevenlabsSecretId,
    elevenlabsAgentId,
  } = body;

  const sessionBody: Record<string, unknown> = {
    mode: "LITE",
    avatar_id: avatarId,
  };

  if (elevenlabsSecretId && elevenlabsAgentId) {
    sessionBody.elevenlabs_agent_config = {
      secret_id: elevenlabsSecretId,
      agent_id: elevenlabsAgentId,
    };
  }

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
      { error: "Failed to create session", details: err },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
