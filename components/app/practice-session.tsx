"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock3,
  FileText,
  Lightbulb,
  MessageSquareText,
  Phone,
  Smile,
  Minus,
  Flame,
  Video,
  X,
} from "lucide-react";
import type { Scenario } from "@/data/scenarios";
import { LiveAvatar, type TranscriptEntry } from "@/components/app/live-avatar";
import { VoiceCall } from "@/components/app/voice-call";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type InterviewMode = "video" | "call";
type InterviewTone = "friendly" | "neutral" | "tough";

const toneOptions = [
  { id: "friendly" as const, label: "Friendly", icon: Smile, description: "Warm and encouraging" },
  { id: "neutral" as const, label: "Neutral", icon: Minus, description: "Standard professional" },
  { id: "tough" as const, label: "Tough", icon: Flame, description: "Pushes back hard" },
];

type PracticePanel = "rubric" | "hints" | "transcript";

type PersistedPracticeState = {
  step?: number;
  seconds?: number;
  interviewMode?: InterviewMode;
  interviewTone?: InterviewTone;
  transcript?: TranscriptEntry[];
  savedAt?: number;
};

const PRACTICE_STATE_TTL_MS = 24 * 60 * 60 * 1000;

export function PracticeSession({ scenario }: { scenario: Scenario }) {
  const router = useRouter();
  const storageKey = `practice-state:${scenario.id}`;
  const [panel, setPanel] = useState<PracticePanel>("rubric");
  const [seconds, setSeconds] = useState(0);
  const [step, setStep] = useState(0);
  const [interviewMode, setInterviewMode] = useState<InterviewMode>("video");
  const [interviewTone, setInterviewTone] = useState<InterviewTone>("neutral");
  const [sessionState, setSessionState] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);

  // Hydrate in-progress practice state from localStorage so a browser refresh
  // can resume the active loop instead of resetting everything.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as PersistedPracticeState;
        const fresh = !saved.savedAt || Date.now() - saved.savedAt < PRACTICE_STATE_TTL_MS;
        if (fresh) {
          if (typeof saved.step === "number") setStep(saved.step);
          if (typeof saved.seconds === "number") setSeconds(saved.seconds);
          if (saved.interviewMode) setInterviewMode(saved.interviewMode);
          if (saved.interviewTone) setInterviewTone(saved.interviewTone);
          if (Array.isArray(saved.transcript)) {
            const revived = saved.transcript
              .filter((entry) => entry && !entry.partial)
              .map((entry) => ({
                ...entry,
                timestamp: new Date(entry.timestamp),
              }));
            setTranscript(revived);
            if (revived.length > 0 || saved.seconds || saved.step) {
              setResumed(true);
            }
          }
        } else {
          window.localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // Ignore corrupted storage — user can just restart.
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const persistableTranscript = transcript.filter((entry) => !entry.partial);
      const payload: PersistedPracticeState = {
        step,
        seconds,
        interviewMode,
        interviewTone,
        transcript: persistableTranscript,
        savedAt: Date.now(),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Storage unavailable (private mode, quota) — resume is best-effort.
    }
  }, [hydrated, storageKey, step, seconds, interviewMode, interviewTone, transcript]);

  useEffect(() => {
    if (sessionState !== "connected") return;

    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [sessionState]);

  const handleSessionEnd = useCallback(
    async (finalTranscript: TranscriptEntry[]) => {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      try {
        const startRes = await fetch("/api/interview/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "behavioral",
            scenarioId: scenario.id,
          }),
        });
        const { id } = await startRes.json();

        // If a document is selected, use FormData; otherwise use JSON
        if (selectedDocument) {
          const formData = new FormData();
          formData.append("interviewId", id);
          formData.append("transcript", JSON.stringify(finalTranscript));
          formData.append("document", selectedDocument);

          await fetch("/api/interview/end", {
            method: "POST",
            body: formData,
          });
        } else {
          await fetch("/api/interview/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              interviewId: id,
              transcript: finalTranscript,
            }),
          });
        }

        router.push(`/review/${scenario.id}?interviewId=${id}`);
      } catch {
        router.push(`/review/${scenario.id}`);
      }
    },
    [router, scenario.id, selectedDocument, storageKey],
  );

  const stepCount = scenario.followUps.length + 1;
  const progress = ((step + 1) / stepCount) * 100;
  const currentPrompt = step === 0 ? scenario.prompt : scenario.followUps[step - 1];

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  }, [seconds]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white/75 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
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
        <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center md:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">
              {scenario.interviewer} · {scenario.interviewerRole}
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl">{scenario.title}</h1>
            {sessionState === "idle" && (
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                {currentPrompt}
              </p>
            )}
            {sessionState === "idle" && resumed && (
              <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                Resuming your previous session · {transcript.length} saved turn{transcript.length === 1 ? "" : "s"}
              </div>
            )}
          </div>

          {/* Mode + tone selectors -- only shown before session starts */}
          {sessionState === "idle" && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-white p-1">
                <button
                  onClick={() => setInterviewMode("video")}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                    interviewMode === "video"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Video className="size-4" />
                  Video
                </button>
                <button
                  onClick={() => setInterviewMode("call")}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                    interviewMode === "call"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Phone className="size-4" />
                  Voice
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Tone:</span>
                {toneOptions.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setInterviewTone(tone.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                      interviewTone === tone.id
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    title={tone.description}
                  >
                    <tone.icon className="size-3.5" />
                    {tone.label}
                  </button>
                ))}
              </div>

              {/* Document upload */}
              <div className="flex max-w-sm items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  <FileText className="size-4" />
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) {
                        setSelectedDocument(file);
                      }
                    }}
                    className="hidden"
                  />
                  <span>{selectedDocument ? "Change" : "Upload"} resume</span>
                </label>
                {selectedDocument && (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {selectedDocument.name}
                    </span>
                    <button
                      onClick={() => setSelectedDocument(null)}
                      className="ml-auto text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {interviewMode === "video" ? (
            <LiveAvatar
              onTranscriptUpdate={setTranscript}
              onSessionEnd={handleSessionEnd}
              onStateChange={setSessionState}
            />
          ) : (
            <VoiceCall
              onTranscriptUpdate={setTranscript}
              onSessionEnd={handleSessionEnd}
              onStateChange={setSessionState}
            />
          )}

          {sessionState === "idle" && (
            <div className="flex flex-wrap justify-center gap-2">
              {scenario.focus.map((focus) => (
                <span
                  key={focus}
                  className="rounded-full border border-border bg-white/75 px-3 py-1 text-sm font-medium text-foreground/85"
                >
                  {focus}
                </span>
              ))}
            </div>
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
                    <span className="text-xs font-medium text-muted-foreground/85">
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
                {transcript.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Transcript will appear here once the interview starts.
                  </p>
                )}
                {transcript.map((entry, index) => {
                  const isUser = entry.role === "user";

                  return (
                    <div
                      key={index}
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
                          entry.partial && "opacity-70",
                        )}
                      >
                        {entry.content}
                        {entry.partial && (
                          <span className="ml-1 inline-block animate-pulse">|</span>
                        )}
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
