"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock3,
  FileText,
  Lightbulb,
  MessageSquareText,
  Mic,
  MicOff,
  Pause,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import type { Scenario } from "@/data/scenarios";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const transcriptPreview = [
  {
    speaker: "Interviewer",
    text: "Walk me through your background and why this role is the natural next step.",
  },
  {
    speaker: "You",
    text: "I currently operate as a senior engineer with staff-level scope across platform reliability and developer tooling...",
  },
  {
    speaker: "You",
    text: "The thread across those roles is that I like solving leveraged problems that make product teams faster.",
  },
];

type PracticePanel = "rubric" | "hints" | "transcript";

export function PracticeSession({ scenario }: { scenario: Scenario }) {
  const router = useRouter();
  const [panel, setPanel] = useState<PracticePanel>("rubric");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isRecording || isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPaused, isRecording]);

  const stepCount = scenario.followUps.length + 1;
  const progress = ((step + 1) / stepCount) * 100;
  const currentPrompt = step === 0 ? scenario.prompt : scenario.followUps[step - 1];

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  }, [seconds]);

  function handleAdvance() {
    if (step < scenario.followUps.length) {
      setStep((value) => value + 1);
      return;
    }

    router.push(`/review/${scenario.id}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white/75 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="text-muted-foreground transition hover:text-foreground">
            <X className="size-5" />
          </Link>

          <div className="flex min-w-0 items-center gap-4">
            <div className="hidden text-sm text-muted-foreground sm:block">
              Question {step + 1} of {stepCount}
            </div>
            <Progress value={progress} className="w-32 sm:w-48" />
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Clock3 className="size-4" />
            <span className="tabular-nums">{formattedTime}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10 text-center md:px-10">
          <div className="max-w-2xl">
            <div className="relative mx-auto mb-6 flex size-32 items-center justify-center rounded-full bg-white p-1 shadow-xl shadow-primary/10">
              <img
                src={scenario.interviewerAvatar}
                alt={scenario.interviewer}
                className="size-full rounded-full object-cover"
              />
              {isRecording && !isPaused ? (
                <div className="absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                  <Volume2 className="size-5" />
                </div>
              ) : null}
            </div>

            <p className="text-sm font-medium text-muted-foreground">
              {scenario.interviewer} · {scenario.interviewerRole}
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl">{scenario.title}</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
              {currentPrompt}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {scenario.focus.map((focus) => (
                <span
                  key={focus}
                  className="rounded-full border border-border bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  {focus}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isRecording ? (
              <button
                onClick={() => setIsPaused((value) => !value)}
                className="flex size-12 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-[1.02]"
              >
                <Pause className="size-5 text-muted-foreground" />
              </button>
            ) : null}

            <button
              onClick={() => {
                setIsRecording((value) => !value);
                setIsPaused(false);
              }}
              className={cn(
                "flex size-[4.5rem] items-center justify-center rounded-full text-white shadow-xl transition",
                isRecording
                  ? "bg-red-500 shadow-red-500/30 hover:bg-red-600"
                  : "bg-primary shadow-primary/25 hover:bg-primary/90",
              )}
            >
              {isRecording ? <MicOff className="size-8" /> : <Mic className="size-8" />}
            </button>

            {isRecording ? (
              <button
                onClick={handleAdvance}
                className="flex size-12 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-[1.02]"
              >
                <SkipForward className="size-5 text-muted-foreground" />
              </button>
            ) : null}
          </div>

          {isRecording ? (
            <div className="flex items-end gap-1">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-1.5 rounded-full bg-primary transition-all",
                    isPaused ? "h-3 opacity-35" : "animate-pulse",
                  )}
                  style={{ height: isPaused ? 12 : 14 + ((index % 3) + 1) * 8 }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Start the mic to simulate a live response.
            </p>
          )}
        </section>

        <aside className="border-t border-border bg-white/85 backdrop-blur lg:w-[24rem] lg:border-l lg:border-t-0">
          <div className="grid grid-cols-3 border-b border-border">
            {[
              { id: "rubric", label: "Rubric", icon: MessageSquareText },
              { id: "hints", label: "Hints", icon: Lightbulb },
              { id: "transcript", label: "Transcript", icon: FileText },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPanel(item.id as PracticePanel)}
                className={cn(
                  "flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition",
                  panel === item.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="space-y-4 p-5">
            {panel === "rubric" ? (
              <>
                <p className="text-sm leading-6 text-muted-foreground">
                  This interview loop scores against the same visible rubric every time.
                </p>
                {scenario.rubric.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3"
                  >
                    <span className="text-sm font-medium">{item}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </>
            ) : null}

            {panel === "hints" ? (
              <>
                <p className="text-sm leading-6 text-muted-foreground">
                  Keep these visible during practice to anchor the answer.
                </p>
                {scenario.hints.map((hint, index) => (
                  <div key={hint} className="flex gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6">{hint}</p>
                  </div>
                ))}
              </>
            ) : null}

            {panel === "transcript" ? (
              <div className="space-y-4">
                {transcriptPreview.map((entry) => {
                  const isUser = entry.speaker === "You";

                  return (
                    <div
                      key={`${entry.speaker}-${entry.text}`}
                      className={cn("flex gap-3", isUser && "flex-row-reverse text-right")}
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {isUser ? "Y" : "I"}
                      </div>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
                          isUser ? "bg-primary/8" : "bg-muted/70",
                        )}
                      >
                        {entry.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
