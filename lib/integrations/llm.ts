import * as openAiProvider from "@/lib/integrations/openai";
import * as geminiProvider from "@/lib/integrations/gemini";
import {
  extractDocumentText,
  formatDocumentContextForPrompt,
} from "@/lib/document-extract";

export type LlmProviderName = "openai" | "gemini";

type PdfInput = {
  mimeType: "application/pdf";
  dataBase64: string;
};

type ImageInput = {
  mimeType: string;
  dataBase64: string;
};

type DocumentInput = {
  mimeType: string;
  filename: string;
  buffer: Buffer;
};

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
  executeWithPdf?: (
    prompt: string,
    systemPrompt: string,
    modelOverride: string | undefined,
    temperature: number,
    maxTokens: number,
    pdf: PdfInput,
    fallbacks?: string[],
  ) => Promise<{ content: string; modelUsed: string }>;
  executeWithImage?: (
    prompt: string,
    systemPrompt: string,
    modelOverride: string | undefined,
    temperature: number,
    maxTokens: number,
    image: ImageInput,
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
  document?: DocumentInput;
  image?: ImageInput;
};

type LlResult = {
  content: string;
  modelUsed: string;
  json?: unknown;
};

async function appendDocumentContext(prompt: string, document: DocumentInput) {
  const extracted = await extractDocumentText(document.buffer, document.filename);

  return [
    prompt,
    "",
    "Candidate background document:",
    formatDocumentContextForPrompt(extracted),
  ].join("\n");
}

export async function ll(
  prompt: string,
  options: LlOptions = {},
): Promise<LlResult> {
  const providerName = options.providerOverride ?? getLlmProvider();
  const provider = getProviderByName(providerName);
  const systemPrompt = options.systemPrompt ?? "You are a helpful AI assistant.";
  const temperature = options.temperature ?? 0.2;
  const maxTokens = options.maxTokens ?? 4000;
  const trimmedPrompt = prompt.trim();
  const document = options.document;
  const image = options.image;
  const hasImage = Boolean(image);

  const shouldUseNativePdf =
    !hasImage &&
    document?.mimeType === "application/pdf" &&
    Boolean(provider.executeWithPdf);

  try {
    if (hasImage && !provider.executeWithImage) {
      throw new Error(`Provider ${providerName} does not support image input.`);
    }

    const promptWithDocument =
      document && !shouldUseNativePdf
        ? await appendDocumentContext(trimmedPrompt, document)
        : trimmedPrompt;

    let response: { content: string; modelUsed: string };

    if (hasImage) {
      if (!image || !provider.executeWithImage) {
        throw new Error(`Provider ${providerName} does not support image input.`);
      }

      response = await provider.executeWithImage(
        promptWithDocument,
        systemPrompt,
        options.modelOverride,
        temperature,
        maxTokens,
        image,
        options.modelFallbacks,
      );
    } else if (shouldUseNativePdf) {
      if (!document) {
        throw new Error("Document was not provided.");
      }

      if (!provider.executeWithPdf) {
        throw new Error(`Provider ${providerName} does not support native PDF input.`);
      }

      response = await provider.executeWithPdf(
        trimmedPrompt,
        systemPrompt,
        options.modelOverride,
        temperature,
        maxTokens,
        {
          mimeType: "application/pdf",
          dataBase64: document.buffer.toString("base64"),
        },
        options.modelFallbacks,
      );
    } else {
      response = await provider.execute(
        promptWithDocument,
        systemPrompt,
        options.modelOverride,
        temperature,
        maxTokens,
        options.modelFallbacks,
      );
    }

    const { content, modelUsed } = response;

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
