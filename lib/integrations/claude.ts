import { env } from "@/lib/env";

export const DEFAULT_CLAUDE_MODEL = "claude-opus-4-6";

const DEFAULT_CLAUDE_BASE_URL = "https://api.anthropic.com";
const ANTHROPIC_API_VERSION = "2023-06-01";

type ExecuteResult = {
  content: string;
  modelUsed: string;
};

export function getModel() {
  return env.claudeModel || DEFAULT_CLAUDE_MODEL;
}

function getApiConfig() {
  const apiKey = env.anthropicApiKey;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  return {
    apiKey,
    baseUrl: (env.claudeBaseUrl || DEFAULT_CLAUDE_BASE_URL).replace(/\/$/, ""),
  };
}

function getAnthropicHeaders(apiKey: string) {
  return {
    "x-api-key": apiKey,
    "anthropic-version": ANTHROPIC_API_VERSION,
    "content-type": "application/json",
  };
}

function extractContent(responseJson: unknown): string {
  if (!responseJson || typeof responseJson !== "object") {
    return "";
  }

  const top = responseJson as Record<string, unknown>;
  const content = top.content;

  if (!Array.isArray(content)) {
    return "";
  }

  const text = content
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }
      const block = item as Record<string, unknown>;
      if (block.type !== "text") {
        return "";
      }
      return typeof block.text === "string" ? block.text : "";
    })
    .filter(Boolean)
    .join("\n");

  return text;
}

export async function fetchAvailableModels(): Promise<
  [models: string[], warning: string | null]
> {
  try {
    const { apiKey, baseUrl } = getApiConfig();
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: "GET",
      headers: getAnthropicHeaders(apiKey),
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
      .filter((modelId): modelId is string => Boolean(modelId));

    return [models.length > 0 ? models : [DEFAULT_CLAUDE_MODEL], null];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [[DEFAULT_CLAUDE_MODEL], message];
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
      "No models configured. Set CLAUDE_MODEL or provide a model override.",
    );
  }

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: "POST",
        headers: getAnthropicHeaders(apiKey),
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature,
        }),
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
