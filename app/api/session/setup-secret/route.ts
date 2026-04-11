import { NextResponse } from "next/server";

const LIVEAVATAR_API = "https://api.liveavatar.com";

// One-time setup: stores ElevenLabs API key in LiveAvatar and returns a secret_id.
// Call this once, then save the secret_id as ELEVENLABS_SECRET_ID in .env.local.
export async function POST() {
  const heygenKey = process.env.HEYGEN_API_KEY;
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

  if (!heygenKey || !elevenLabsKey) {
    return NextResponse.json(
      { error: "HEYGEN_API_KEY and ELEVENLABS_API_KEY required" },
      { status: 503 },
    );
  }

  const res = await fetch(`${LIVEAVATAR_API}/v1/secrets`, {
    method: "POST",
    headers: {
      "X-API-KEY": heygenKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret_type: "ELEVENLABS_API_KEY",
      secret_value: elevenLabsKey,
      secret_name: "ElevenLabs Agent Key",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json(
      { error: "Failed to store secret", details: err },
      { status: res.status },
    );
  }

  const rawData: unknown = await res.json();
  const data =
    rawData && typeof rawData === "object"
      ? (rawData as Record<string, unknown>)
      : {};
  return NextResponse.json(data);
}
