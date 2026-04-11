"use client";

import { FormEvent, useState } from "react";
import { Bot, FileText, Loader2, Send, X } from "lucide-react";
import { MainShell } from "@/components/app/main-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type LlmTestResponse = {
  content: string;
  modelUsed: string;
  provider: string;
};

type DocumentTestResponse = {
  text: string;
  filename: string;
  extracted_length: number;
};

export default function LlmTestPage() {
  const [prompt, setPrompt] = useState(
    "Give me one behavioral interview question and a strong STAR-style sample answer.",
  );
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a concise interview prep assistant. Respond with actionable, practical guidance.",
  );
  const [providerOverride, setProviderOverride] = useState("");
  const [result, setResult] = useState<LlmTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentResult, setDocumentResult] = useState<DocumentTestResponse | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/llm/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          providerOverride: providerOverride || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult(null);
        setError(typeof data?.error === "string" ? data.error : "LLM call failed.");
        return;
      }

      setResult(data as LlmTestResponse);
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
      const formData = new FormData();
      formData.append("file", documentFile);

      const res = await fetch("/api/document/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setDocumentError(typeof data?.error === "string" ? data.error : "Extraction failed.");
        return;
      }

      setDocumentResult(data as DocumentTestResponse);
    } catch {
      setDocumentError("Request failed. Check network and try again.");
    } finally {
      setIsDocumentLoading(false);
    }
  }

  return (
    <MainShell>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <div>
          <h1 className="flex items-center gap-3">
            <Bot className="size-7 text-primary" />
            LLM Sandbox
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
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
                <label className="text-sm font-medium">Provider override (optional)</label>
                <Input
                  value={providerOverride}
                  onChange={(event) => setProviderOverride(event.target.value)}
                  placeholder="openai or gemini"
                />
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
                  <Badge className="bg-secondary text-secondary-foreground">provider: {result.provider}</Badge>
                  <Badge className="bg-secondary text-secondary-foreground">model: {result.modelUsed}</Badge>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="min-h-28 whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6">
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
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload a PDF or Word document to test extraction.
                  </p>
                </div>
                <FileText className="size-6 text-muted-foreground" />
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
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                {documentFile && (
                  <p className="text-xs text-muted-foreground">
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
                    <Badge className="bg-secondary text-secondary-foreground">
                      {documentResult.filename}
                    </Badge>
                    <Badge className="bg-secondary text-secondary-foreground">
                      {documentResult.extracted_length} chars
                    </Badge>
                  </div>
                ) : null}
              </div>

              {documentError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {documentError}
                </div>
              ) : null}

              {documentResult && (
                <div className="max-h-72 overflow-y-auto rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6 whitespace-pre-wrap">
                  {documentResult.text}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainShell>
  );
}
