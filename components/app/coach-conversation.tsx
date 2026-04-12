"use client";

import { useRef, useState, useEffect } from "react";
import {
  FileText,
  Loader2,
  MessageCircleMore,
  Send,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Message = {
  role: "user" | "coach";
  text: string;
};

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
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, action }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "coach", text: data.error || "Something went wrong. Try again." },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "coach", text: data.reply || "No response received." }]);
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
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-none text-xs font-semibold ${
                      isUser
                        ? "bg-primary text-primary-content"
                        : "bg-linear-to-br from-violet-500 to-indigo-500 text-white"
                    }`}
                  >
                    {isUser ? "Y" : "C"}
                  </div>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-6 ${
                      isUser ? "bg-primary text-primary-content" : "bg-base-200/75"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-none bg-linear-to-br from-violet-500 to-indigo-500 text-white text-xs font-semibold">
                  C
                </div>
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
