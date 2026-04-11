"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock3,
  FileText,
  Lightbulb,
  MessageSquareText,
  X,
} from "lucide-react";
import type { Scenario } from "@/data/scenarios";
import {
  LiveAvatar,
  type TranscriptEntry,
} from "@/components/app/live-avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type PracticePanel = "rubric" | "hints" | "transcript";

type PersistedTranscriptTurn = {
  role: "interviewer" | "user";
  content: string;
  timestamp: string;
  step: number;
};

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function getStepForTranscriptIndex(
  transcript: TranscriptEntry[],
  index: number,
  maxStep: number,
) {
  let interviewerCount = 0;

  for (let currentIndex = 0; currentIndex <= index; currentIndex += 1) {
    if (transcript[currentIndex]?.role === "interviewer") {
      interviewerCount += 1;
    }
  }

  return Math.min(Math.max(interviewerCount - 1, 0), maxStep);
}

function toPersistedTranscript(
  transcript: TranscriptEntry[],
  sessionStartedAt: number,
  maxStep: number,
): PersistedTranscriptTurn[] {
  return transcript
    .filter((entry) => entry.content.trim())
    .map((entry, index) => ({
      role: entry.role,
      content: entry.content.trim(),
      timestamp: formatElapsed(
        Math.max(
          0,
          Math.round((entry.timestamp.getTime() - sessionStartedAt) / 1000),
        ),
      ),
      step: getStepForTranscriptIndex(transcript, index, maxStep),
    }));
}

async function readJsonSafely(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function PracticeSession({ scenario }: { scenario: Scenario }) {
  const router = useRouter();
  const [panel, setPanel] = useState<PracticePanel>("rubric");
  const [seconds, setSeconds] = useState(0);
  const [avatarState, setAvatarState] = useState<
    "idle" | "connecting" | "connected" | "ended"
  >("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const interviewIdRef = useRef<string | null>(null);
  const hasCreatedInterviewRef = useRef(false);
  const hasHandledSessionEndRef = useRef(false);
  const syncedTranscriptLengthRef = useRef(0);
  const sessionStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    interviewIdRef.current = interviewId;
  }, [interviewId]);

  useEffect(() => {
    if (avatarState !== "connected") {
      return;
    }

    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [avatarState]);

  const stepCount = scenario.followUps.length + 1;
  const step = useMemo(() => {
    const interviewerTurns = transcript.filter(
      (entry) => entry.role === "interviewer",
    ).length;

    return Math.min(Math.max(interviewerTurns - 1, 0), scenario.followUps.length);
  }, [scenario.followUps.length, transcript]);
  const progress = ((step + 1) / stepCount) * 100;
  const currentPrompt = step === 0 ? scenario.prompt : scenario.followUps[step - 1];
  const formattedTime = useMemo(() => formatElapsed(seconds), [seconds]);

  const transcriptPreview = useMemo(() => {
    const sessionStartedAt = sessionStartedAtRef.current;

    return transcript.map((entry, index) => ({
      role: entry.role,
      content: entry.content,
      timestamp:
        sessionStartedAt !== null
          ? formatElapsed(
              Math.max(
                0,
                Math.round((entry.timestamp.getTime() - sessionStartedAt) / 1000),
              ),
            )
          : "--",
      step: getStepForTranscriptIndex(transcript, index, scenario.followUps.length),
    }));
  }, [scenario.followUps.length, transcript]);

  const createInterviewSession = useCallback(async () => {
    const response = await fetch("/api/interview/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: scenario.trackId,
        difficulty: scenario.difficulty,
        scenarioId: scenario.id,
      }),
    });

    if (response.ok) {
      const payload = (await response.json()) as { id?: string };
      return payload.id ?? null;
    }

    const payload = await readJsonSafely(response);

    if (response.status === 401) {
      setSessionNotice("Sign in to save and score this session. Practice can still run locally.");
      return null;
    }

    if (response.status === 503) {
      setSessionNotice(
        "MongoDB is unavailable, so this session will stay local and review falls back to the demo scorecard.",
      );
      return null;
    }

    if (typeof payload?.error === "string") {
      setSessionNotice(`${payload.error} Practice will continue locally for now.`);
      return null;
    }

    throw new Error("Unable to start the practice session.");
  }, [scenario.difficulty, scenario.id, scenario.trackId]);

  const appendTranscriptTurns = useCallback(async (turns: PersistedTranscriptTurn[]) => {
    const currentInterviewId = interviewIdRef.current;

    if (!currentInterviewId || !turns.length) {
      return;
    }

    const response = await fetch(`/api/interview/${currentInterviewId}/transcript`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ turns }),
    });

    if (response.ok) {
      return;
    }

    const payload = await readJsonSafely(response);
    const error =
      typeof payload?.error === "string"
        ? payload.error
        : "Unable to sync the latest transcript turns.";

    setSessionNotice(`${error} Practice continues locally until review submission.`);
  }, []);

  const ensureInterviewSession = useCallback(async () => {
    if (hasCreatedInterviewRef.current) {
      return;
    }

    hasCreatedInterviewRef.current = true;
    hasHandledSessionEndRef.current = false;
    syncedTranscriptLengthRef.current = 0;
    sessionStartedAtRef.current = Date.now();
    setSeconds(0);
    setSessionError(null);
    setIsStartingInterview(true);

    try {
      const createdInterviewId = await createInterviewSession();
      interviewIdRef.current = createdInterviewId;
      setInterviewId(createdInterviewId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start the practice session.";
      setSessionError(message);
    } finally {
      setIsStartingInterview(false);
    }
  }, [createInterviewSession]);

  useEffect(() => {
    if (avatarState === "connecting") {
      void ensureInterviewSession();
    }
  }, [avatarState, ensureInterviewSession]);

  useEffect(() => {
    if (!interviewId || !transcript.length || sessionStartedAtRef.current === null) {
      return;
    }

    const persistedTranscript = toPersistedTranscript(
      transcript,
      sessionStartedAtRef.current,
      scenario.followUps.length,
    );

    if (persistedTranscript.length <= syncedTranscriptLengthRef.current) {
      return;
    }

    const nextTurns = persistedTranscript.slice(syncedTranscriptLengthRef.current);
    syncedTranscriptLengthRef.current = persistedTranscript.length;
    void appendTranscriptTurns(nextTurns);
  }, [appendTranscriptTurns, interviewId, scenario.followUps.length, transcript]);

  const handleSessionEnd = useCallback(
    async (finalTranscript: TranscriptEntry[]) => {
      if (hasHandledSessionEndRef.current) {
        return;
      }

      hasHandledSessionEndRef.current = true;
      setTranscript(finalTranscript);

      const sessionStartedAt = sessionStartedAtRef.current ?? Date.now();
      const persistedTranscript = toPersistedTranscript(
        finalTranscript,
        sessionStartedAt,
        scenario.followUps.length,
      );

      if (!interviewIdRef.current) {
        router.push(`/review/${scenario.id}`);
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch("/api/interview/end", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interviewId: interviewIdRef.current,
            transcript: persistedTranscript,
          }),
        });

        const payload = await readJsonSafely(response);
        const params = new URLSearchParams({
          interviewId: interviewIdRef.current,
        });

        if (!response.ok || payload?.graded === false) {
          params.set("grading", "pending");
        }

        router.push(`/review/${scenario.id}?${params.toString()}`);
      } catch {
        const params = new URLSearchParams({
          interviewId: interviewIdRef.current,
          grading: "pending",
        });
        router.push(`/review/${scenario.id}?${params.toString()}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, scenario.followUps.length, scenario.id],
  );

  const handleTranscriptUpdate = useCallback((nextTranscript: TranscriptEntry[]) => {
    setTranscript(nextTranscript);
  }, []);

  const handleAvatarStateChange = useCallback(
    (nextState: "idle" | "connecting" | "connected" | "ended") => {
      setAvatarState(nextState);

      if (nextState === "connected") {
        setSessionNotice(null);
        setSessionError(null);
      }
    },
    [],
  );

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
        <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center md:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">
              {scenario.interviewer} · {scenario.interviewerRole}
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl">{scenario.title}</h1>
            {avatarState === "idle" && (
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                {currentPrompt}
              </p>
            )}
          </div>

          <LiveAvatar
            onTranscriptUpdate={handleTranscriptUpdate}
            onSessionEnd={handleSessionEnd}
            onStateChange={handleAvatarStateChange}
          />

          {avatarState === "idle" && (
            <div className="flex flex-wrap justify-center gap-2">
              {scenario.focus.map((focus) => (
                <span
                  key={focus}
                  className="rounded-full border border-border bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  {focus}
                </span>
              ))}
            </div>
          )}

          {(isStartingInterview || isSubmitting) && (
            <p className="text-sm text-muted-foreground">
              {isStartingInterview
                ? "Creating a saved practice attempt..."
                : "Saving transcript and preparing review..."}
            </p>
          )}

          {sessionNotice ? (
            <div className="max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm leading-6 text-amber-800">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{sessionNotice}</span>
              </div>
            </div>
          ) : null}

          {sessionError ? (
            <div className="max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm leading-6 text-red-700">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{sessionError}</span>
              </div>
            </div>
          ) : null}
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
                {transcriptPreview.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Transcript will appear here once the interview starts.
                  </p>
                )}
                {transcriptPreview.map((entry, index) => {
                  const isUser = entry.role === "user";

                  return (
                    <div
                      key={`${entry.role}-${entry.timestamp}-${index}`}
                      className={cn("flex gap-3", isUser && "flex-row-reverse text-right")}
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold uppercase tracking-[0.12em]",
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isUser ? "You" : "AI"}
                      </div>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-[1.35rem] px-4 py-3 text-sm leading-6",
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/70 text-foreground",
                        )}
                      >
                        <div className="mb-1 text-[0.6875rem] uppercase tracking-[0.18em] opacity-70">
                          {entry.timestamp}
                        </div>
                        {entry.content}
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
