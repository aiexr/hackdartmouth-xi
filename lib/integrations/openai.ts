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

type ErrorDetails = {
  name?: string;
  message?: string;
  stack?: string;
  code?: string;
  errno?: number | string;
  syscall?: string;
  hostname?: string;
  host?: string;
  port?: number | string;
  address?: string;
  cause?: ErrorDetails | string;
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
  responseFormat: "text" | "json",
) {
  const provider = detectProvider(model);

  const payload: Record<string, unknown> = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages,
  };

  if (responseFormat === "json" && (provider === "openai" || provider === "gemini")) {
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

function formatErrorDetails(error: unknown): ErrorDetails | string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const details: ErrorDetails = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  const errorWithFields = error as Error & {
    code?: string;
    errno?: number | string;
    syscall?: string;
    hostname?: string;
    host?: string;
    port?: number | string;
    address?: string;
    cause?: unknown;
  };

  if (errorWithFields.code) details.code = errorWithFields.code;
  if (errorWithFields.errno !== undefined) details.errno = errorWithFields.errno;
  if (errorWithFields.syscall) details.syscall = errorWithFields.syscall;
  if (errorWithFields.hostname) details.hostname = errorWithFields.hostname;
  if (errorWithFields.host) details.host = errorWithFields.host;
  if (errorWithFields.port !== undefined) details.port = errorWithFields.port;
  if (errorWithFields.address) details.address = errorWithFields.address;
  if (errorWithFields.cause !== undefined) {
    details.cause =
      errorWithFields.cause instanceof Error || typeof errorWithFields.cause === "object"
        ? formatErrorDetails(errorWithFields.cause)
        : String(errorWithFields.cause);
  }

  return details;
}

function logOpenAiFailure(
  phase: string,
  details: Record<string, unknown>,
  error?: unknown,
) {
  console.error("[llm:openai]", {
    phase,
    ...details,
    ...(error !== undefined ? { error: formatErrorDetails(error) } : {}),
  });
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
    logOpenAiFailure(
      "fetchAvailableModels",
      {
        baseUrl: DARTMOUTH_OPENAI_BASE_URL,
      },
      error,
    );
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
  responseFormat: "text" | "json" = "text",
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
    const requestStartedAt = Date.now();
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
          buildCompletionPayload(model, temperature, maxTokens, messages, responseFormat),
        ),
      });

      if (!response.ok) {
        const text = await response.text();
        logOpenAiFailure("chatCompletionResponseNotOk", {
          baseUrl,
          endpoint: `${baseUrl}/chat/completions`,
          model,
          status: response.status,
          statusText: response.statusText,
          durationMs: Date.now() - requestStartedAt,
          responseSnippet: text.slice(0, 300),
        });
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
      logOpenAiFailure(
        "chatCompletionAttemptFailed",
        {
          baseUrl,
          endpoint: `${baseUrl}/chat/completions`,
          model,
          modelAttemptCount: modelsToTry.length,
          responseFormat,
          promptChars: prompt.length,
          systemPromptChars: systemPrompt.length,
          temperature,
          maxTokens,
          durationMs: Date.now() - requestStartedAt,
        },
        error,
      );
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
  responseFormat: "text" | "json" = "text",
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
    const requestStartedAt = Date.now();
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
          buildCompletionPayload(model, temperature, maxTokens, messages, responseFormat),
        ),
      });

      if (!response.ok) {
        const text = await response.text();
        logOpenAiFailure("chatCompletionImageResponseNotOk", {
          baseUrl,
          endpoint: `${baseUrl}/chat/completions`,
          model,
          status: response.status,
          statusText: response.statusText,
          durationMs: Date.now() - requestStartedAt,
          responseSnippet: text.slice(0, 300),
          imageMimeType: image.mimeType,
        });
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
      logOpenAiFailure(
        "chatCompletionImageAttemptFailed",
        {
          baseUrl,
          endpoint: `${baseUrl}/chat/completions`,
          model,
          modelAttemptCount: modelsToTry.length,
          responseFormat,
          promptChars: prompt.length,
          systemPromptChars: systemPrompt.length,
          temperature,
          maxTokens,
          durationMs: Date.now() - requestStartedAt,
          imageMimeType: image.mimeType,
        },
        error,
      );
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `All ${modelsToTry.length} image model(s) failed. Last error: ${lastError?.message ?? "unknown"}`,
  );
}
