import { NextRequest, NextResponse } from "next/server";
import { getLlmProvider, ll, type LlmProviderName } from "@/lib/integrations/llm";

const DEFAULT_DARTMOUTH_VISION_MODEL = "qwen.qwen3-vl-32b-instruct-fp8";

type ImagePayload = {
  mimeType: string;
  dataBase64: string;
};

function parseImagePayload(body: Record<string, unknown>): ImagePayload | undefined {
  const rawImage = body.image;
  if (rawImage == null) {
    return undefined;
  }

  if (typeof rawImage !== "object") {
    throw new Error("image must be an object with mimeType and dataBase64.");
  }

  const image = rawImage as Record<string, unknown>;
  const mimeType =
    typeof image.mimeType === "string" ? image.mimeType.trim().toLowerCase() : "";
  const dataBase64 =
    typeof image.dataBase64 === "string" ? image.dataBase64.trim() : "";

  if (!mimeType || !dataBase64) {
    throw new Error("image.mimeType and image.dataBase64 are required.");
  }

  if (!mimeType.startsWith("image/")) {
    throw new Error("image.mimeType must start with image/.");
  }

  return {
    mimeType,
    dataBase64,
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody: unknown = await req.json();
    const body =
      rawBody && typeof rawBody === "object"
        ? (rawBody as Record<string, unknown>)
        : {};

    const prompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const providerOverride =
      body.providerOverride === "openai" || body.providerOverride === "gemini"
        ? (body.providerOverride as LlmProviderName)
        : undefined;

    const systemPrompt =
      typeof body.systemPrompt === "string" && body.systemPrompt.trim()
        ? body.systemPrompt.trim()
        : "You are a concise interview prep assistant. Respond with actionable, practical guidance.";

    const modelOverride =
      typeof body.modelOverride === "string" && body.modelOverride.trim()
        ? body.modelOverride.trim()
        : undefined;

    let imagePayload: ImagePayload | undefined;
    try {
      imagePayload = parseImagePayload(body);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid image payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const autoSelectedVisionModel = Boolean(
      imagePayload && !providerOverride && !modelOverride,
    );
    const effectiveProviderOverride = autoSelectedVisionModel
      ? "openai"
      : providerOverride;
    const effectiveModelOverride = autoSelectedVisionModel
      ? DEFAULT_DARTMOUTH_VISION_MODEL
      : modelOverride;
    const effectiveSystemPrompt = imagePayload
      ? [
          systemPrompt,
          "",
          "An image is attached and available to you in this request.",
          "Do not claim that you cannot view images.",
          "If image bytes are unreadable, explicitly say: IMAGE_UNREADABLE.",
        ].join("\n")
      : systemPrompt;

    const result = await ll(prompt, {
      systemPrompt: effectiveSystemPrompt,
      providerOverride: effectiveProviderOverride,
      modelOverride: effectiveModelOverride,
      temperature: 0.2,
      maxTokens: 1200,
      image: imagePayload,
    });

    return NextResponse.json({
      content: result.content,
      modelUsed: result.modelUsed,
      provider: effectiveProviderOverride ?? getLlmProvider(),
      imageProcessed: Boolean(imagePayload),
      autoSelectedVisionModel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
