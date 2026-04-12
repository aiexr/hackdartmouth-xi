"use client";

import { useRef, useState, useEffect } from "react";
import {
  FileText,
  Loader2,
  MessageCircleMore,
  Send,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeLogo } from "@/components/app/theme-logo";

type Message = {
  role: "user" | "coach";
  text: string;
};

type CoachHistoryItem = {
  role: "user" | "coach";
  text: string;
};

function parseCoachJson(candidate: string) {
  try {
    const parsed = JSON.parse(candidate) as {
      error?: unknown;
      message?: unknown;
      reply?: unknown;
      content?: unknown;
      text?: unknown;
    };

    if (typeof parsed.reply === "string" && parsed.reply.trim()) {
      return parsed.reply.trim();
    }

    if (typeof parsed.content === "string" && parsed.content.trim()) {
      return parsed.content.trim();
    }

    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message.trim();
    }

    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error.trim();
    }

    if (typeof parsed.text === "string" && parsed.text.trim()) {
      return parsed.text.trim();
    }
  } catch {
    return null;
  }

  return null;
}

function extractLeadingJsonObject(text: string) {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("{")) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < trimmed.length; i += 1) {
    const char = trimmed[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return trimmed.slice(0, i + 1);
      }
    }
  }

  return null;
}

function normalizeCoachText(text: string | undefined) {
  if (!text?.trim()) {
    return "No response received.";
  }

  const trimmed = text.trim();
  const directJsonReply = parseCoachJson(trimmed);
  if (directJsonReply) {
    return directJsonReply;
  }

  const leadingJson = extractLeadingJsonObject(trimmed);
  if (leadingJson) {
    const leadingJsonReply = parseCoachJson(leadingJson);
    if (leadingJsonReply) {
      return leadingJsonReply;
    }

    const malformedSingleString = leadingJson.match(/^\{\s*"([\s\S]+)"\s*\}$/);
    if (malformedSingleString?.[1]) {
      return malformedSingleString[1].trim();
    }
  }

  return trimmed;
}

function CoachMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-3 list-inside list-disc space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-inside list-decimal space-y-1">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto rounded-none border border-border/70">
            <table className="min-w-full border-collapse text-left text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-base-300/55">{children}</thead>,
        th: ({ children }) => (
          <th className="border border-border/70 px-2 py-1 font-semibold">{children}</th>
        ),
        td: ({ children }) => <td className="border border-border/70 px-2 py-1">{children}</td>,
        pre: ({ children }) => (
          <pre className="my-3 overflow-x-auto rounded-none bg-base-300/55 p-3 text-xs leading-6">
            {children}
          </pre>
        ),
        code: ({ children }) => (
          <code className="rounded-none bg-base-300/65 px-1 py-0.5 font-mono text-[0.85em]">
            {children}
          </code>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function CoachAvatarIcon() {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-none border border-border/70 bg-base-100">
      <ThemeLogo alt="LeetSpeak coach" className="size-5 w-auto object-contain" />
    </div>
  );
}

export function CoachConversation() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "coach",
      text: "I'm your interview coach. You can ask me anything about interview prep, or hit Resume Review and I'll give you concrete feedback on what to fix.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendToCoach(message: string, action?: string) {
    const userMsg = message || (action === "resume-review" ? "Review my resume" : "");
    const history: CoachHistoryItem[] = messages
      .slice(-8)
      .map((item) => ({ role: item.role, text: item.text }));

    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, action, history }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "coach",
            text: normalizeCoachText(data.error || data.reply || "Something went wrong. Try again."),
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "coach", text: normalizeCoachText(data.reply) },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "coach", text: "Network error — check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    sendToCoach(trimmed);
  }

  return (
    <div className="space-y-6">
      <div
        className="cursor-pointer rounded-none border border-border bg-base-100/80 p-5 transition hover:ring-2 hover:ring-primary/20"
        onClick={() => !loading && sendToCoach("", "resume-review")}
      >
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-none bg-neutral/10 text-base-content">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="text-base">Resume review</h3>
            <p className="mt-1 text-sm leading-6 text-base-content/60">
              Get specific feedback on weak framing, vague bullets, and missing impact.
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden bg-base-100/85">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4 text-sm font-semibold">
          <MessageCircleMore className="size-4 text-primary" />
          Coaching Chat
        </div>

        <div ref={scrollRef} className="max-h-[28rem] overflow-y-auto">
          <CardContent className="space-y-4 p-5">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={i}
                  className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  {isUser ? (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-none bg-primary text-xs font-semibold text-primary-content">
                      Y
                    </div>
                  ) : (
                    <CoachAvatarIcon />
                  )}
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                      isUser
                        ? "whitespace-pre-wrap bg-primary text-primary-content"
                        : "bg-base-200/75"
                    }`}
                  >
                    {isUser ? msg.text : <CoachMarkdown text={msg.text} />}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3">
                <CoachAvatarIcon />
                <div className="flex items-center gap-2 rounded-3xl bg-base-200/75 px-4 py-3 text-sm text-base-content/60">
                  <Loader2 className="size-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </CardContent>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 border-t border-border px-5 py-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about interview prep, storytelling, or your resume..."
            disabled={loading}
          />
          <Button size="icon" type="submit" disabled={loading || !input.trim()} aria-label="Send coach message">
            <Send className="size-4" />
          </Button>
        </form>

        <div className="border-t border-border/70 bg-linear-to-r from-violet-50 to-indigo-50 px-5 py-3 text-sm text-violet-900/80">
          <span className="inline-flex items-center gap-2 font-medium">
            <Sparkles className="size-4 text-violet-500" />
            Tip
          </span>
          <span className="ml-2">
            Upload your resume on the Profile page first so the coach can give you specific feedback.
          </span>
        </div>
      </Card>
    </div>
  );
}
