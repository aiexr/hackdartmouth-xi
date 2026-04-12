"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircleMore, Send, Sparkles, Target, FileText, Linkedin } from "lucide-react";
import { coachMessages } from "@/data/scenarios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    title: "Analyze my LinkedIn",
    description: "Compare your positioning to the target loop.",
    icon: Linkedin,
    href: "/profile",
  },
  {
    title: "Resume review",
    description: "Find weak framing before the interview happens.",
    icon: FileText,
    href: "/profile",
  },
  {
    title: "Set a plan",
    description: "Build a one-week role-specific practice sequence.",
    icon: Target,
    href: null,
  },
];

export function CoachConversation() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((item) => (
          <Card
            key={item.title}
            className={`bg-base-100/80 ${item.href ? "cursor-pointer transition hover:ring-2 hover:ring-primary/20" : ""}`}
            onClick={item.href ? () => router.push(item.href) : undefined}
          >
            <CardContent className="p-5">
              <div className="flex size-11 items-center justify-center rounded-none bg-neutral/10 text-base-content">
                <item.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-base-content/60">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden bg-base-100/85">
        <div className="flex items-center gap-2 border-b border-base-300 px-5 py-4 text-sm font-semibold">
          <MessageCircleMore className="size-4 text-primary" />
          Coaching Chat
        </div>

        <CardContent className="space-y-4 p-5">
          {coachMessages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={`${message.role}-${message.text}`}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-none text-xs font-semibold ${
                    isUser
                      ? "bg-primary text-primary-content"
                      : "bg-linear-to-br from-violet-500 to-indigo-500 text-white"
                  }`}
                >
                  {isUser ? "A" : "C"}
                </div>
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                    isUser ? "bg-primary text-primary-content" : "bg-base-200/75"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            );
          })}
        </CardContent>

        <div className="flex gap-3 border-t border-base-300 px-5 py-4">
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask the coach how to tighten a story, improve delivery, or prep a loop."
          />
          <Button size="icon" aria-label="Send coach message">
            <Send className="size-4" />
          </Button>
        </div>

        <div className="border-t border-base-300/70 bg-linear-to-r from-violet-50 to-indigo-50 px-5 py-3 text-sm text-violet-900/80">
          <span className="inline-flex items-center gap-2 font-medium">
            <Sparkles className="size-4 text-violet-500" />
            Coach note
          </span>
          <span className="ml-2">
            Keep the coach grounded in recent attempts so the advice stays specific.
          </span>
        </div>
      </Card>
    </div>
  );
}
