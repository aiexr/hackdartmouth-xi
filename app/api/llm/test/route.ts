import { NextRequest, NextResponse } from "next/server";
import { getLlmProvider, ll, type LlmProviderName } from "@/lib/integrations/llm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const prompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const providerOverride =
      body?.providerOverride === "openai" || body?.providerOverride === "gemini"
        ? (body.providerOverride as LlmProviderName)
        : undefined;

    const systemPrompt =
      typeof body?.systemPrompt === "string" && body.systemPrompt.trim()
        ? body.systemPrompt.trim()
        : "You are a concise interview prep assistant. Respond with actionable, practical guidance.";

    const modelOverride =
      typeof body?.modelOverride === "string" && body.modelOverride.trim()
        ? body.modelOverride.trim()
        : undefined;

    const result = await ll(prompt, {
      systemPrompt,
      providerOverride,
      modelOverride,
      temperature: 0.2,
      maxTokens: 1200,
    });

    return NextResponse.json({
      content: result.content,
      modelUsed: result.modelUsed,
      provider: providerOverride ?? getLlmProvider(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
