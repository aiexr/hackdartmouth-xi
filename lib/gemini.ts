import { env } from "@/lib/env";

type GeminiPrompt = {
  system: string;
  transcript: string;
  rubric: string[];
};

export async function scoreInterviewAttempt(payload: GeminiPrompt) {
  if (!env.geminiApiKey) {
    return {
      ok: false as const,
      reason: "Missing GEMINI_API_KEY",
    };
  }

  const prompt = [
    payload.system,
    "",
    "Rubric:",
    ...payload.rubric.map((item) => `- ${item}`),
    "",
    "Transcript:",
    payload.transcript,
  ].join("\n");

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) {
    return {
      ok: false as const,
      reason: `Gemini request failed with ${response.status}`,
    };
  }

  return {
    ok: true as const,
    response: await response.json(),
  };
}
