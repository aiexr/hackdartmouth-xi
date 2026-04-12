"use client";

import { FormEvent, useState } from "react";
import { Bot, FileText, Loader2, Send, X } from "lucide-react";
import { extractDocumentTextInBrowser } from "@/lib/client-document-extract";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type LlmTestResponse = {
  content: string;
  modelUsed: string;
  provider: string;
  imageProcessed: boolean;
  autoSelectedVisionModel: boolean;
};

type DocumentTestResponse = {
  text: string;
  filename: string;
  extracted_length: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toLlmTestResponse(value: Record<string, unknown>): LlmTestResponse {
  return {
    content: typeof value.content === "string" ? value.content : "",
    modelUsed: typeof value.modelUsed === "string" ? value.modelUsed : "unknown",
    provider: typeof value.provider === "string" ? value.provider : "unknown",
    imageProcessed: Boolean(value.imageProcessed),
    autoSelectedVisionModel: Boolean(value.autoSelectedVisionModel),
  };
}

function toDocumentTestResponse(value: Record<string, unknown>): DocumentTestResponse {
  return {
    text: typeof value.text === "string" ? value.text : "",
    filename: typeof value.filename === "string" ? value.filename : "unknown",
    extracted_length:
      typeof value.extracted_length === "number" ? value.extracted_length : 0,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read image data."));
    };
    reader.onerror = () => reject(new Error("Failed to read image data."));
    reader.readAsDataURL(file);
  });
}

async function imageFileToPayload(file: File) {
  const dataUrl = await fileToDataUrl(file);
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Selected file is not a valid base64 image.");
  }

  return {
    mimeType: match[1],
    dataBase64: match[2],
  };
}

export default function LlmTestPage() {
  const [prompt, setPrompt] = useState(
    "Give me one behavioral interview question and a strong STAR-style sample answer.",
  );
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a concise interview prep assistant. Respond with actionable, practical guidance.",
  );
  const [useProviderOverride, setUseProviderOverride] = useState(false);
  const [providerOverride, setProviderOverride] = useState<"openai" | "gemini">("openai");
  const [result, setResult] = useState<LlmTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentResult, setDocumentResult] = useState<DocumentTestResponse | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const imagePayload = imageFile
        ? await imageFileToPayload(imageFile)
        : undefined;

      const res = await fetch("/api/llm/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          providerOverride: useProviderOverride ? providerOverride : undefined,
          image: imagePayload,
        }),
      });

      const data = asRecord(await res.json());

      if (!res.ok) {
        setResult(null);
        setError(typeof data?.error === "string" ? data.error : "LLM call failed.");
        return;
      }

      setResult(toLlmTestResponse(data));
    } catch {
      setResult(null);
      setError("Request failed. Check network/API configuration and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDocumentUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentFile) return;

    setIsDocumentLoading(true);
    setDocumentError(null);
    setDocumentResult(null);

    try {
      const extracted = await extractDocumentTextInBrowser(documentFile);
      setDocumentResult(toDocumentTestResponse(asRecord(extracted)));
    } catch (error) {
      setDocumentError(
        error instanceof Error ? error.message : "Request failed. Check network and try again.",
      );
    } finally {
      setIsDocumentLoading(false);
    }
  }

  return (
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <div>
          <h1 className="flex items-center gap-3">
            <Bot className="size-7 text-primary" />
            LLM Sandbox
          </h1>
          <p className="mt-3 max-w-3xl text-base text-base-content/60">
            Quick internal surface for validating the LLM integration wiring, prompt behavior, and document extraction.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">System prompt</label>
                <Textarea
                  value={systemPrompt}
                  onChange={(event) => setSystemPrompt(event.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt</label>
                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Image (optional)</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0] ?? null;
                      setImageFile(file);
                    }}
                  />
                  {imageFile ? (
                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Clear selected image"
                    >
                      <X className="size-4" />
                    </button>
                  ) : null}
                </div>
                {imageFile ? (
                  <p className="text-xs text-muted-foreground">
                    Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(1)}KB)
                  </p>
                ) : null}
                {imageFile && !useProviderOverride ? (
                  <p className="text-xs text-muted-foreground">
                    Image attached with no provider override. Gemini will use your
                    configured Gemini model. OpenAI will fall back to Dartmouth vision
                    model qwen.qwen3-vl-32b-instruct-fp8.
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Provider override (optional)</label>
                  <Switch
                    checked={useProviderOverride}
                    onCheckedChange={setUseProviderOverride}
                    aria-label="Enable provider override"
                  />
                </div>

                {useProviderOverride ? (
                  <div className="flex items-center gap-3 rounded-none border border-border px-3 py-2">
                    <span
                      className={providerOverride === "openai" ? "text-sm font-medium text-base-content" : "text-sm text-base-content/60"}
                    >
                      OpenAI
                    </span>
                    <Switch
                      checked={providerOverride === "gemini"}
                      onCheckedChange={(checked) =>
                        setProviderOverride(checked ? "gemini" : "openai")
                      }
                      aria-label="Toggle provider between OpenAI and Gemini"
                    />
                    <span
                      className={providerOverride === "gemini" ? "text-sm font-medium text-base-content" : "text-sm text-base-content/60"}
                    >
                      Gemini
                    </span>
                  </div>
                ) : null}
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Run test
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl">Response</h2>
              {result ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-neutral/10 text-base-content">provider: {result.provider}</Badge>
                  <Badge className="bg-neutral/10 text-base-content">model: {result.modelUsed}</Badge>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-none border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="min-h-28 whitespace-pre-wrap rounded-none border border-border bg-base-200/40 p-4 text-sm leading-6">
              {result?.content || "Run a test prompt to see model output here."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleDocumentUpload}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Document Extraction Test</h2>
                  <p className="mt-1 text-sm text-base-content/60">
                    Upload a PDF or Word document to test extraction.
                  </p>
                </div>
                <FileText className="size-6 text-base-content/60" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Document file</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) {
                        setDocumentFile(file);
                        setDocumentResult(null);
                        setDocumentError(null);
                      }
                    }}
                  />
                  {documentFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentFile(null);
                        setDocumentResult(null);
                      }}
                      className="text-base-content/60 hover:text-base-content"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                {documentFile && (
                  <p className="text-xs text-base-content/60">
                    Selected: {documentFile.name} ({(documentFile.size / 1024).toFixed(1)}KB)
                  </p>
                )}
              </div>

              <Button type="submit" disabled={!documentFile || isDocumentLoading}>
                {isDocumentLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileText className="size-4" />
                )}
                Extract text
              </Button>
            </form>
          </CardContent>
        </Card>

        {(documentResult || documentError) && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl">Extracted Text</h2>
                {documentResult ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-neutral/10 text-base-content">
                      {documentResult.filename}
                    </Badge>
                    <Badge className="bg-neutral/10 text-base-content">
                      {documentResult.extracted_length} chars
                    </Badge>
                  </div>
                ) : null}
              </div>

              {documentError ? (
                <div className="rounded-none border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {documentError}
                </div>
              ) : null}

              {documentResult && (
                <div className="max-h-72 overflow-y-auto rounded-none border border-border bg-base-200/40 p-4 text-sm leading-6 whitespace-pre-wrap">
                  {documentResult.text}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
  );
}
