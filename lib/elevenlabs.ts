import { env } from "@/lib/env";

export async function synthesizeInterviewerTurn(text: string) {
  if (!env.elevenLabsApiKey || !env.elevenLabsVoiceId) {
    return {
      ok: false as const,
      reason: "Missing ElevenLabs credentials",
    };
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${env.elevenLabsVoiceId}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "xi-api-key": env.elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
      }),
    },
  );

  if (!response.ok) {
    return {
      ok: false as const,
      reason: `ElevenLabs request failed with ${response.status}`,
    };
  }

  return {
    ok: true as const,
    audio: await response.arrayBuffer(),
  };
}
