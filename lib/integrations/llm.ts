import * as openAiProvider from "@/lib/integrations/openai";
import * as geminiProvider from "@/lib/integrations/gemini";

export type LlmProviderName = "openai" | "gemini";

type ProviderModule = {
  getModel: () => string;
  fetchAvailableModels: () => Promise<[models: string[], warning: string | null]>;
  execute: (
    prompt: string,
    systemPrompt: string,
    modelOverride: string | undefined,
    temperature: number,
    maxTokens: number,
    fallbacks?: string[],
  ) => Promise<{ content: string; modelUsed: string }>;
};

export function getLlmProvider(): LlmProviderName {
  const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();
  if (provider === "gemini") {
    return "gemini";
  }

  return "openai";
}

function getProviderByName(name: LlmProviderName): ProviderModule {
  if (name === "openai") {
    return openAiProvider;
  }

  if (name === "gemini") {
    return geminiProvider;
  }

  throw new Error(`Invalid provider: ${name}. Must be 'openai' or 'gemini'.`);
}

function getProvider(): ProviderModule {
  return getProviderByName(getLlmProvider());
}

export async function fetchAvailableModelsForProvider(provider: LlmProviderName) {
  return getProviderByName(provider).fetchAvailableModels();
}

export function getModel() {
  return getProvider().getModel();
}

export async function fetchAvailableModels() {
  return getProvider().fetchAvailableModels();
}

function stripJsonFences(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]+?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

type LlOptions = {
  systemPrompt?: string;
  modelOverride?: string;
  modelFallbacks?: string[];
  providerOverride?: LlmProviderName;
  temperature?: number;
  maxTokens?: number;
  parseJson?: boolean;
};

type LlResult = {
  content: string;
  modelUsed: string;
  json?: unknown;
};

export async function ll(
  prompt: string,
  options: LlOptions = {},
): Promise<LlResult> {
  const provider = options.providerOverride
    ? getProviderByName(options.providerOverride)
    : getProvider();
  const systemPrompt = options.systemPrompt ?? "You are a helpful AI assistant.";
  const temperature = options.temperature ?? 0.2;
  const maxTokens = options.maxTokens ?? 4000;

  try {
    const { content, modelUsed } = await provider.execute(
      prompt.trim(),
      systemPrompt,
      options.modelOverride,
      temperature,
      maxTokens,
      options.modelFallbacks,
    );

    if (!options.parseJson) {
      return {
        content,
        modelUsed,
      };
    }

    const parsed = JSON.parse(stripJsonFences(content));
    return {
      content,
      modelUsed,
      json: parsed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`LL call failed: ${message}`);
  }
}
