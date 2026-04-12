import { env } from "@/lib/env";

export const DEFAULT_OPENAI_MODEL = "google_genai.gemini-2.5-flash";

const DARTMOUTH_OPENAI_BASE_URL = "https://chat.dartmouth.edu/api";

const NON_CHAT_MODEL_KEYWORDS = [
  "openai_responses.",
  "embedding",
  "embed",
  "bge",
  "whisper",
  "tts",
  "dall-e",
  "moderation",
  "voyage",
  "codellama",
  "vision-instruct",
];

type ChatMessage = {
  role: "system" | "user";
  content:
    | string
    | Array<
        | {
            type: "text";
            text: string;
          }
        | {
            type: "image_url";
            image_url: {
              url: string;
            };
          }
      >;
};

type ExecuteResult = {
  content: string;
  modelUsed: string;
};

type ImagePart = {
  mimeType: string;
  dataBase64: string;
};

export function getModel() {
  return env.openAiModel || DEFAULT_OPENAI_MODEL;
}

function getApiConfig() {
  const apiKey = env.openAiApiKey;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const baseUrl = DARTMOUTH_OPENAI_BASE_URL;

  return {
    apiKey,
    baseUrl,
  };
}

function detectProvider(modelId: string) {
  const normalized = modelId.toLowerCase();

  if (normalized.includes("claude") || normalized.includes("anthropic")) {
    return "claude" as const;
  }

  if (
    normalized.includes("gpt") ||
    normalized.includes("openai") ||
    normalized.includes("o1") ||
    normalized.includes("o3") ||
    normalized.includes("o4")
  ) {
    return "openai" as const;
  }

  if (normalized.includes("gemini") || normalized.includes("google")) {
    return "gemini" as const;
  }

  return "unknown" as const;
}

function buildCompletionPayload(
  model: string,
  temperature: number,
  maxTokens: number,
  messages: ChatMessage[],
) {
  const provider = detectProvider(model);

  const payload: Record<string, unknown> = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages,
  };

  if (provider === "openai" || provider === "gemini") {
    payload.response_format = { type: "json_object" };
  }

  return payload;
}

function extractContent(responseJson: unknown): string {
  if (!responseJson || typeof responseJson !== "object") {
    return "";
  }

  const top = responseJson as Record<string, unknown>;

  if (typeof top.output_text === "string") {
    return top.output_text;
  }

  const choices = top.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const choice = choices[0] as Record<string, unknown>;
    const message = choice.message as Record<string, unknown> | undefined;
    const messageContent = message?.content;

    if (typeof messageContent === "string") {
      return messageContent;
    }

    if (Array.isArray(messageContent)) {
      const parts = messageContent
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }
          if (part && typeof part === "object") {
            const p = part as Record<string, unknown>;
            return typeof p.text === "string" ? p.text : "";
          }
          return "";
        })
        .filter(Boolean);

      return parts.join("\n");
    }
  }

  return "";
}

function toImageDataUrl(image: ImagePart) {
  const mimeType = image.mimeType.trim().toLowerCase();
  if (!mimeType.startsWith("image/")) {
    throw new Error(`Unsupported image mime type: ${image.mimeType}`);
  }

  const raw = image.dataBase64.trim();
  if (!raw) {
    throw new Error("Image dataBase64 cannot be empty.");
  }

  if (raw.startsWith("data:")) {
    return raw;
  }

  const normalizedBase64 = raw.replace(/\s+/g, "");
  return `data:${mimeType};base64,${normalizedBase64}`;
}

export async function fetchAvailableModels(): Promise<
  [models: string[], warning: string | null]
> {
  try {
    const { apiKey, baseUrl } = getApiConfig();
    const response = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Model list request failed with ${response.status}`);
    }

    const json = (await response.json()) as {
      data?: Array<{ id?: string }>;
    };

    const models = (json.data ?? [])
      .map((item) => item.id)
      .filter((modelId): modelId is string => Boolean(modelId))
      .filter(
        (modelId) =>
          !NON_CHAT_MODEL_KEYWORDS.some((keyword) =>
            modelId.toLowerCase().includes(keyword),
          ),
      )
      .sort((a, b) => a.localeCompare(b));

    return [models.length > 0 ? models : [DEFAULT_OPENAI_MODEL], null];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [[DEFAULT_OPENAI_MODEL], message];
  }
}

export async function execute(
  prompt: string,
  systemPrompt: string,
  modelOverride: string | undefined,
  temperature: number,
  maxTokens: number,
  fallbacks: string[] = [],
): Promise<ExecuteResult> {
  const { apiKey, baseUrl } = getApiConfig();
  const modelsToTry = [modelOverride || getModel(), ...fallbacks].filter(Boolean);

  if (modelsToTry.length === 0) {
    throw new Error(
      "No models configured. Set OPENAI_MODEL or provide a model override.",
    );
  }

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ];

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(
          buildCompletionPayload(model, temperature, maxTokens, messages),
        ),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Model ${model} failed with ${response.status}: ${text.slice(0, 300)}`,
        );
      }

      const json = await response.json();
      const content = extractContent(json);

      if (!content) {
        throw new Error(`Model ${model} returned empty content`);
      }

      return {
        content,
        modelUsed: model,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `All ${modelsToTry.length} model(s) failed. Last error: ${lastError?.message ?? "unknown"}`,
  );
}

export async function executeWithImage(
  prompt: string,
  systemPrompt: string,
  modelOverride: string | undefined,
  temperature: number,
  maxTokens: number,
  image: ImagePart,
  fallbacks: string[] = [],
): Promise<ExecuteResult> {
  const { apiKey, baseUrl } = getApiConfig();
  const modelsToTry = [modelOverride || getModel(), ...fallbacks].filter(Boolean);

  if (modelsToTry.length === 0) {
    throw new Error(
      "No models configured. Set OPENAI_MODEL or provide a model override.",
    );
  }

  const imageUrl = toImageDataUrl(image);
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ];

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(
          buildCompletionPayload(model, temperature, maxTokens, messages),
        ),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Model ${model} failed with ${response.status}: ${text.slice(0, 300)}`,
        );
      }

      const json = await response.json();
      const content = extractContent(json);

      if (!content) {
        throw new Error(`Model ${model} returned empty content`);
      }

      return {
        content,
        modelUsed: model,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `All ${modelsToTry.length} image model(s) failed. Last error: ${lastError?.message ?? "unknown"}`,
  );
}
