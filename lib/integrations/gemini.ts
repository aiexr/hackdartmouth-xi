import { env } from "@/lib/env";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

type ExecuteResult = {
  content: string;
  modelUsed: string;
};

export function getModel() {
  return env.geminiModel || DEFAULT_GEMINI_MODEL;
}

function getApiConfig() {
  const apiKey = env.geminiApiKey;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  return {
    apiKey,
    baseUrl: DEFAULT_GEMINI_BASE_URL,
  };
}

function normalizeModelName(model: string) {
  return model.startsWith("models/") ? model.slice("models/".length) : model;
}

function extractContent(responseJson: unknown): string {
  if (!responseJson || typeof responseJson !== "object") {
    return "";
  }

  const top = responseJson as Record<string, unknown>;
  const candidates = top.candidates;

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return "";
  }

  const first = candidates[0];
  if (!first || typeof first !== "object") {
    return "";
  }

  const content = (first as Record<string, unknown>).content;
  if (!content || typeof content !== "object") {
    return "";
  }

  const parts = (content as Record<string, unknown>).parts;
  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => {
      if (!part || typeof part !== "object") {
        return "";
      }

      const text = (part as Record<string, unknown>).text;
      return typeof text === "string" ? text : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function fetchAvailableModels(): Promise<
  [models: string[], warning: string | null]
> {
  try {
    const { apiKey, baseUrl } = getApiConfig();
    const response = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        "x-goog-api-key": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Model list request failed with ${response.status}`);
    }

    const json = (await response.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    };

    const models = (json.models ?? [])
      .filter((item) =>
        Array.isArray(item.supportedGenerationMethods)
          ? item.supportedGenerationMethods.includes("generateContent")
          : false,
      )
      .map((item) => item.name)
      .filter((modelName): modelName is string => Boolean(modelName))
      .map(normalizeModelName)
      .sort((a, b) => a.localeCompare(b));

    return [models.length > 0 ? models : [DEFAULT_GEMINI_MODEL], null];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [[DEFAULT_GEMINI_MODEL], message];
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
      "No models configured. Set GEMINI_MODEL or provide a model override.",
    );
  }

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    const normalizedModel = normalizeModelName(model);

    try {
      const response = await fetch(
        `${baseUrl}/models/${normalizedModel}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Model ${normalizedModel} failed with ${response.status}: ${text.slice(0, 300)}`,
        );
      }

      const json = await response.json();
      const content = extractContent(json);

      if (!content) {
        throw new Error(`Model ${normalizedModel} returned empty content`);
      }

      return {
        content,
        modelUsed: normalizedModel,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `All ${modelsToTry.length} model(s) failed. Last error: ${lastError?.message ?? "unknown"}`,
  );
}
