"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Braces,
  Clock3,
  FileText,
  Lightbulb,
  MessageSquareText,
<<<<<<< HEAD
  Minus,
  Phone,
  RefreshCcw,
  Smile,
  Sparkles,
=======
  Phone,
>>>>>>> fb97397 (feat: merge ui theme with non-border-radiused elements and fix hydration logic)
  Video,
  X,
  Flame,
} from "lucide-react";
import type { Scenario } from "@/data/scenarios";
import { LiveAvatar, type TranscriptEntry } from "@/components/app/live-avatar";
import { VoiceCall } from "@/components/app/voice-call";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[24rem] items-center justify-center rounded-3xl border border-border bg-muted/30 text-sm text-muted-foreground">
      Loading editor...
    </div>
  ),
});

type InterviewMode = "video" | "call";
<<<<<<< HEAD
type InterviewTone = "friendly" | "neutral" | "tough";
type PracticePanel = "rubric" | "hints" | "transcript";
type PracticePrompt = { id: string; text: string } | null;
=======
>>>>>>> fb97397 (feat: merge ui theme with non-border-radiused elements and fix hydration logic)

type InterviewTone = "friendly" | "neutral" | "tough";

type PersistedPracticeState = {
  seconds?: number;
  interviewMode?: InterviewMode;
  interviewTone?: InterviewTone;
  transcript?: TranscriptEntry[];
  editorContent?: string;
  savedAt?: number;
};

const PRACTICE_STATE_TTL_MS = 24 * 60 * 60 * 1000;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function buildDefaultEditorContent(scenario: Scenario) {
  if (scenario.codingProblem?.starterCode) {
    return scenario.codingProblem.starterCode;
  }

  return "// Sketch your approach here.\n";
}

function buildInitialInterviewerPrompt(scenario: Scenario) {
  const sharedContext = [
    `You are ${scenario.interviewer}, a ${scenario.interviewerRole}, conducting a ${scenario.category} mock interview.`,
    `Scenario title: ${scenario.title}`,
    `Scenario pattern: ${scenario.pattern}`,
    `Primary prompt: ${scenario.prompt}`,
    `Focus areas: ${scenario.focus.join(", ")}`,
    `Follow-up probes: ${scenario.followUps.join(" | ") || "Use your judgment."}`,
  ];

  if (scenario.category === "behavioral") {
    sharedContext.push(
      "Run this as a classic STAR behavioral interview. Push for specifics, actions taken by the candidate, and measurable results.",
      "Start with a brief greeting and then ask the opening question.",
    );
  } else if (scenario.category === "technical") {
    const problem = scenario.codingProblem;
    if (problem) {
      sharedContext.push(
        "This is a live coding round. The candidate has a code editor open.",
        `Problem description: ${problem.description}`,
        `Examples: ${problem.examples
          .map(
            (example, index) =>
              `Example ${index + 1} input: ${example.input}; output: ${example.output}${
                example.explanation ? `; explanation: ${example.explanation}` : ""
              }`,
          )
          .join(" | ")}`,
        `Constraints: ${problem.constraints.join(" | ")}`,
        `Expected optimal approach for grading context: ${problem.optimalApproach}`,
      );
    }

    sharedContext.push(
      "Probe on correctness, edge cases, testing instinct, and time/space complexity. Do not fully solve the problem for the candidate.",
      "Open with a short greeting, restate the problem crisply, and ask the candidate to talk through their first approach.",
    );
  } else if (scenario.category === "system-design") {
    sharedContext.push(
      "Guide the candidate through requirements, components, data flow, scaling bottlenecks, and tradeoffs.",
      "Open with the design prompt and ask for the first set of clarifying requirements.",
    );
  } else if (scenario.category === "product") {
    sharedContext.push(
      "Play the role of a stakeholder or executive interviewer. Push on priorities, metrics, tradeoffs, and decision quality.",
      "Open with the scenario and quickly ask how the candidate would structure the problem.",
    );
  } else {
    sharedContext.push(
      "Play the role of an engagement manager in a case interview. Expect top-down structure, explicit assumptions, and synthesis.",
      "Open with the case prompt and ask the candidate to structure the problem before diving into details.",
    );
  }

  return sharedContext.join("\n");
}

function buildCodeReviewPrompt(scenario: Scenario, editorContent: string) {
  const trimmed = editorContent.trim();
  const snapshot =
    trimmed.length > 0
      ? trimmed.slice(0, 5000)
      : "The editor is still blank. Ask the candidate to outline the algorithm before coding.";

  return [
    `Continue the ${scenario.title} technical interview.`,
    "The candidate has shared their current editor state.",
    "Use it in your next response to ask a concise, code-aware follow-up about correctness, edge cases, complexity, or implementation tradeoffs.",
    "Do not give away the full solution.",
    "",
    "Current editor content:",
    snapshot,
  ].join("\n");
}

export function PracticeSession({
  scenario,
  displayTitle,
}: {
  scenario: Scenario;
  displayTitle?: string;
}) {
  const router = useRouter();
<<<<<<< HEAD
  const storageKey = `practice-state:${scenario.id}`;
  const isTechnical = scenario.category === "technical";

=======
>>>>>>> fb97397 (feat: merge ui theme with non-border-radiused elements and fix hydration logic)
  const [panel, setPanel] = useState<PracticePanel>("rubric");
  const [seconds, setSeconds] = useState(0);
  const [interviewMode, setInterviewMode] = useState<InterviewMode>(
    isTechnical ? "video" : "video",
  );
  const [interviewTone, setInterviewTone] = useState<InterviewTone>("neutral");
  const [sessionState, setSessionState] = useState<
    "idle" | "connecting" | "connected" | "ended"
  >("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [editorContent, setEditorContent] = useState(() =>
    buildDefaultEditorContent(scenario),
  );
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [interviewerPrompt, setInterviewerPrompt] = useState<PracticePrompt>(null);
  const [lastCodeSyncLabel, setLastCodeSyncLabel] = useState<string | null>(null);

  const sessionStartRef = useRef<number | null>(null);
  const initialPromptSentRef = useRef(false);

  useEffect(() => {
    if (!isTechnical) {
      return;
    }

    setInterviewMode("video");
  }, [isTechnical]);

<<<<<<< HEAD
=======
  const storageKey = `practice-session-${scenario.id}`;

  // Hydrate in-progress practice state from localStorage so a browser refresh
  // can resume the active loop instead of resetting everything.
>>>>>>> fb97397 (feat: merge ui theme with non-border-radiused elements and fix hydration logic)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as PersistedPracticeState;
        const fresh = !saved.savedAt || Date.now() - saved.savedAt < PRACTICE_STATE_TTL_MS;

        if (fresh) {
          if (typeof saved.seconds === "number") setSeconds(saved.seconds);
          if (!isTechnical && saved.interviewMode) setInterviewMode(saved.interviewMode);
          if (saved.interviewTone) setInterviewTone(saved.interviewTone);
          if (typeof saved.editorContent === "string" && isTechnical) {
            setEditorContent(saved.editorContent);
          }
          if (Array.isArray(saved.transcript)) {
            const revived = saved.transcript
              .filter((entry) => entry && !entry.partial)
              .map((entry, index) => ({
                ...entry,
                id:
                  typeof entry.id === "string" && entry.id.length > 0
                    ? entry.id
                    : `rehydrated-${scenario.id}-${index}`,
                timestamp: new Date(entry.timestamp),
              }));
            setTranscript(revived);
            if (revived.length > 0 || saved.seconds || saved.editorContent) {
              setResumed(true);
            }
          }
        } else {
          window.localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // Ignore corrupted storage.
    }
    setHydrated(true);
<<<<<<< HEAD
  }, [isTechnical, scenario.id, storageKey]);
=======
  }, [storageKey, scenario.id]);
>>>>>>> fb97397 (feat: merge ui theme with non-border-radiused elements and fix hydration logic)

  useEffect(() => {
    if (!hydrated) return;

    try {
      const persistableTranscript = transcript.filter((entry) => !entry.partial);
      const payload: PersistedPracticeState = {
        seconds,
        interviewMode: isTechnical ? "video" : interviewMode,
        interviewTone,
        transcript: persistableTranscript,
        editorContent: isTechnical ? editorContent : undefined,
        savedAt: Date.now(),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Storage is best-effort only.
    }
  }, [
    editorContent,
    hydrated,
    interviewMode,
    interviewTone,
    isTechnical,
    seconds,
    storageKey,
    transcript,
  ]);

  useEffect(() => {
    if (sessionState !== "connected") return;

    if (!sessionStartRef.current) {
      sessionStartRef.current = Date.now();
    }

    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [sessionState]);

  useEffect(() => {
    if (sessionState !== "connected" || initialPromptSentRef.current) {
      return;
    }

    initialPromptSentRef.current = true;
    setInterviewerPrompt({
      id: `${scenario.id}-opening-${Date.now()}`,
      text: buildInitialInterviewerPrompt(scenario),
    });
  }, [scenario, sessionState]);

  useEffect(() => {
    if (sessionState === "idle") {
      initialPromptSentRef.current = false;
      sessionStartRef.current = null;
      setInterviewerPrompt(null);
      setLastCodeSyncLabel(null);
    }
  }, [sessionState]);

  const handleSessionEnd = useCallback(
    async (rawTranscript: TranscriptEntry[]) => {
      const finalTranscript = rawTranscript.filter((entry) => !entry.partial);

      try {
<<<<<<< HEAD
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }

      try {
=======
>>>>>>> fb97397 (feat: merge ui theme with non-border-radiused elements and fix hydration logic)
        const startRes = await fetch("/api/interview/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: scenario.category,
            difficulty: scenario.difficulty,
            scenarioId: scenario.id,
          }),
        });
        const startPayload = asRecord(await startRes.json());
        const id =
          typeof startPayload.id === "string" && startPayload.id.trim()
            ? startPayload.id
            : null;

        if (!id) {
          throw new Error("Missing interview id");
        }

        if (selectedDocument) {
          const formData = new FormData();
          formData.append("interviewId", id);
          formData.append("transcript", JSON.stringify(finalTranscript));
          formData.append("document", selectedDocument);
          if (isTechnical) {
            formData.append("editorContent", editorContent);
          }

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
              editorContent: isTechnical ? editorContent : undefined,
            }),
          });
        }

        window.localStorage.removeItem(storageKey);
        router.push(`/review/${scenario.id}`);
      } catch {
        router.push(`/review/${scenario.id}`);
      }
    },
    [
      editorContent,
      isTechnical,
      router,
      scenario.category,
      scenario.difficulty,
      scenario.id,
      selectedDocument,
      storageKey,
    ],
  );

  const sessionTitle = displayTitle ?? scenario.title;
  const progress = useMemo(() => {
    const answeredTurns = transcript.filter((entry) => entry.role === "user" && !entry.partial).length;
    const targetTurns = Math.max(1, scenario.followUps.length + 1);
    return Math.min(100, ((answeredTurns + (sessionState === "connected" ? 1 : 0)) / targetTurns) * 100);
  }, [scenario.followUps.length, sessionState, transcript]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  }, [seconds]);

  const codingProblem = scenario.codingProblem;

  function syncCodeWithInterviewer() {
    if (!isTechnical || sessionState !== "connected") {
      return;
    }

    setInterviewerPrompt({
      id: `${scenario.id}-code-sync-${Date.now()}`,
      text: buildCodeReviewPrompt(scenario, editorContent),
    });
    setLastCodeSyncLabel("Shared with interviewer just now");
  }

  const mediaSurface =
    interviewMode === "video" ? (
      <LiveAvatar
        tone={interviewTone}
        promptRequest={interviewerPrompt}
        onTranscriptUpdate={setTranscript}
        onSessionEnd={handleSessionEnd}
        onStateChange={setSessionState}
      />
    ) : (
      <VoiceCall
        tone={interviewTone}
        promptRequest={interviewerPrompt}
        onTranscriptUpdate={setTranscript}
        onSessionEnd={handleSessionEnd}
        onStateChange={setSessionState}
      />
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
              {scenario.category === "technical"
                ? "Live coding round"
                : `${scenario.category.replace("-", " ")} round`}
            </div>
            <Progress value={progress} className="w-32 sm:w-48" />
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Clock3 className="size-4" />
            <span className="tabular-nums">{formattedTime}</span>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6 md:px-8">
          <div
            className={cn(
              "grid min-h-0 flex-1 gap-6",
              isTechnical && "xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]",
            )}
<<<<<<< HEAD
          >
            <div className="flex min-h-0 flex-col items-center gap-6 rounded-[28px] border border-border bg-card p-6 text-center">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {scenario.interviewer} · {scenario.interviewerRole}
                </p>
                <h1 className="text-2xl md:text-3xl">{sessionTitle}</h1>
                <p className="text-base leading-7 text-muted-foreground">
                  {scenario.prompt}
                </p>
                {sessionState === "idle" && resumed && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                    Resuming your previous session · {transcript.length} saved turn
                    {transcript.length === 1 ? "" : "s"}
                  </div>
=======
          </div>

          {/* Mode selector -- only shown before session starts */}
          {sessionState === "idle" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-none border border-border bg-white p-1">
                <button
                  onClick={() => setInterviewMode("video")}
                  className={cn(
                    "flex items-center gap-2 rounded-none px-4 py-2 text-sm font-medium transition",
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
                    "flex items-center gap-2 rounded-none px-4 py-2 text-sm font-medium transition",
                    interviewMode === "call"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Phone className="size-4" />
                  Voice
                </button>
              </div>

              {/* Document upload */}
              <div className="flex max-w-sm items-center gap-3 rounded-none border border-border bg-muted/40 px-4 py-3">
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
>>>>>>> fb97397 (feat: merge ui theme with non-border-radiused elements and fix hydration logic)
                )}
              </div>

              {sessionState === "idle" && (
                <div className="flex flex-col items-center gap-3">
                  {!isTechnical && (
                    <div className="flex items-center gap-2 rounded-full border border-border bg-white p-1">
                      <button
                        type="button"
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
                        type="button"
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
                  )}

<<<<<<< HEAD
                  {isTechnical && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                      <Braces className="size-4" />
                      Technical rounds use avatar + editor mode
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Tone:</span>
                    {toneOptions.map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
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

                  <div className="flex max-w-sm items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                      <FileText className="size-4" />
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
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
                        <span className="truncate text-xs text-muted-foreground">
                          {selectedDocument.name}
                        </span>
                        <button
                          type="button"
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

              <div className="flex w-full max-w-4xl flex-1 items-center justify-center">
                {mediaSurface}
              </div>

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
=======
          {sessionState === "idle" && (
            <div className="flex flex-wrap justify-center gap-2">
              {scenario.focus.map((focus) => (
                <span
                  key={focus}
                  className="rounded-none border border-border bg-white/75 px-3 py-1 text-sm font-medium text-foreground/85"
                >
                  {focus}
                </span>
              ))}
>>>>>>> fb97397 (feat: merge ui theme with non-border-radiused elements and fix hydration logic)
            </div>

            {isTechnical && codingProblem ? (
              <div className="flex min-h-0 flex-col rounded-[28px] border border-border bg-card p-5">
                <div className="space-y-4 border-b border-border pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Coding Prompt
                      </p>
                      <h2 className="mt-1 text-xl font-semibold">{scenario.title}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={syncCodeWithInterviewer}
                      disabled={sessionState !== "connected"}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                        sessionState === "connected"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                          : "border-border bg-muted/40 text-muted-foreground",
                      )}
                    >
                      <Sparkles className="size-4" />
                      Share code with interviewer
                    </button>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {codingProblem.description}
                  </p>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Examples
                      </p>
                      <div className="mt-3 space-y-3 text-sm">
                        {codingProblem.examples.map((example, index) => (
                          <div key={`${example.input}-${index}`} className="space-y-1">
                            <p className="font-medium text-foreground">Input: {example.input}</p>
                            <p className="text-muted-foreground">Output: {example.output}</p>
                            {example.explanation ? (
                              <p className="text-muted-foreground">{example.explanation}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Constraints
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {codingProblem.constraints.map((constraint) => (
                          <li key={constraint}>{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {lastCodeSyncLabel ? (
                    <p className="text-xs font-medium text-emerald-700">{lastCodeSyncLabel}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Use the sync button after major edits so the interviewer can probe your current implementation.
                    </p>
                  )}
                </div>

                <div className="min-h-0 flex-1 pt-4">
                  <MonacoEditor
                    theme="vs-light"
                    defaultLanguage="typescript"
                    value={editorContent}
                    onChange={(value) => setEditorContent(value ?? "")}
                    options={{
                      automaticLayout: true,
                      fontSize: 14,
                      minimap: { enabled: false },
                      padding: { top: 16 },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                    }}
                    className="min-h-[26rem] overflow-hidden rounded-3xl border border-border"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  <span>Current language: TypeScript</span>
                  <button
                    type="button"
                    onClick={() => setEditorContent(buildDefaultEditorContent(scenario))}
                    className="inline-flex items-center gap-2 font-medium text-foreground transition hover:text-primary"
                  >
                    <RefreshCcw className="size-4" />
                    Reset starter
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col border-t border-border bg-white/85 backdrop-blur lg:w-[24rem] lg:overflow-y-auto lg:border-l lg:border-t-0">
          <div className="grid grid-cols-3 border-b border-border">
            {[
              { id: "rubric", label: "Rubric", icon: MessageSquareText },
              { id: "hints", label: "Hints", icon: Lightbulb },
              { id: "transcript", label: "Transcript", icon: FileText },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
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

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {panel === "rubric" ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  This round is scored against the visible rubric below.
                </p>
                {scenario.rubric.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-none bg-muted/60 px-4 py-3"
                  >
                    <span className="text-sm font-medium">{item}</span>
                    <span className="text-xs font-medium text-muted-foreground/85">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {panel === "hints" ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Keep these anchors visible while you answer.
                </p>
                {scenario.hints.map((hint, index) => (
                  <div key={hint} className="flex gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-none bg-amber-100 text-xs font-semibold text-amber-700">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6">{hint}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {panel === "transcript" ? (
              <div className="space-y-4">
                {transcript.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Transcript will appear here once the interview starts.
                  </p>
                )}
                {transcript.map((entry) => {
                  const isUser = entry.role === "user";
                  const start = sessionStartRef.current;
                  let relTime = "";
                  if (start) {
                    const diffSec = Math.max(
                      0,
                      Math.round((entry.timestamp.getTime() - start) / 1000),
                    );
                    const minutes = Math.floor(diffSec / 60);
                    const remainder = diffSec % 60;
                    relTime = `${minutes}:${remainder.toString().padStart(2, "0")}`;
                  }

                  return (
                    <div key={entry.id} className="space-y-1">
                      <div
                        className={cn(
                          "flex items-center gap-2 text-[10px] text-muted-foreground",
                          isUser && "justify-end",
                        )}
                      >
                        <span>{isUser ? "You" : "Interviewer"}</span>
                        {relTime && <span>{relTime}</span>}
                      </div>
                      <div
                        className={cn("flex gap-3", isUser && "flex-row-reverse text-right")}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-none px-4 py-3 text-sm leading-6",
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
