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
  Minus,
  Phone,
  RefreshCcw,
  Smile,
  Sparkles,
  Video,
  X,
  Flame,
} from "lucide-react";
import type { Scenario } from "@/data/scenarios";
import { LiveAvatar, type TranscriptEntry } from "@/components/app/live-avatar";
import { VoiceCall } from "@/components/app/voice-call";
import { CodeRunner } from "@/components/app/code-runner";
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

import type { WhiteboardHandle } from "@/components/app/whiteboard-panel";

const WhiteboardPanel = dynamic(
  () => import("@/components/app/whiteboard-panel").then((m) => ({ default: m.WhiteboardPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[28rem] items-center justify-center rounded-3xl border border-border bg-muted/30 text-sm text-muted-foreground">
        Loading whiteboard...
      </div>
    ),
  },
);

type InterviewMode = "video" | "call";
type InterviewTone = "friendly" | "neutral" | "tough";
type PracticePanel = "rubric" | "hints" | "transcript";
type PracticePrompt = { id: string; text: string } | null;

const toneOptions = [
  { id: "friendly" as const, label: "Friendly", icon: Smile, description: "Warm and encouraging" },
  { id: "neutral" as const, label: "Neutral", icon: Minus, description: "Standard professional" },
  { id: "tough" as const, label: "Tough", icon: Flame, description: "Pushes back hard" },
];

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
  } else {
    sharedContext.push(
      "Run this as a behavioral or situational interview. Push for specifics, structured thinking, and measurable outcomes.",
      "Open with a brief greeting and then ask the opening question.",
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
  const storageKey = `practice-state:${scenario.id}`;
  const isTechnical = scenario.category === "technical";
  const isSystemDesign = scenario.category === "system-design";
  const hasSplitView = isTechnical || isSystemDesign;

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
  const whiteboardRef = useRef<WhiteboardHandle | null>(null);

  const sessionStartRef = useRef<number | null>(null);
  const initialPromptSentRef = useRef(false);

  useEffect(() => {
    if (!isTechnical) {
      return;
    }

    setInterviewMode("video");
  }, [isTechnical]);

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
  }, [isTechnical, scenario.id, storageKey]);

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

      // Capture whiteboard screenshot before submitting
      let diagramSnapshot: string | null = null;
      if (isSystemDesign && whiteboardRef.current) {
        diagramSnapshot = await whiteboardRef.current.captureScreenshot();
      }

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
          if (isSystemDesign && diagramSnapshot) {
            formData.append("diagramSnapshot", diagramSnapshot);
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
              diagramSnapshot: isSystemDesign ? diagramSnapshot : undefined,
            }),
          });
        }

        router.push(`/review/${scenario.id}?interviewId=${id}`);
      } catch {
        router.push(`/review/${scenario.id}`);
      }
    },
    [
      editorContent,
      isSystemDesign,
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
      <header className="border-b border-border bg-white/75 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
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

      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {/* Media surface — single mount point, never unmounts, repositioned via CSS */}
        <div
          className={cn(
            "z-20 overflow-hidden transition-all duration-200",
            (sessionState === "idle" || sessionState === "connecting") &&
              "absolute inset-x-0 bottom-6 mx-auto w-full max-w-2xl px-6",
            (sessionState === "connected" || sessionState === "ended") && hasSplitView &&
              "absolute left-4 top-4 w-48 rounded-2xl border border-border bg-card shadow-lg xl:w-56",
            (sessionState === "connected" || sessionState === "ended") && !hasSplitView &&
              "absolute inset-x-0 top-6 mx-auto w-full max-w-2xl px-8",
          )}
        >
          {mediaSurface}
        </div>

        {/* Pre-session screen (idle + connecting) */}
        {(sessionState === "idle" || sessionState === "connecting") && (
          <section className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center">
            <div className="max-w-xl space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                {scenario.interviewer} · {scenario.interviewerRole}
              </p>
              <h1 className="text-2xl md:text-3xl">{sessionTitle}</h1>
              <p className="text-base leading-7 text-muted-foreground">
                {scenario.prompt}
              </p>
              {resumed && (
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                  Resuming your previous session · {transcript.length} saved turn
                  {transcript.length === 1 ? "" : "s"}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
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
            </div>

          </section>
        )}

        {/* Active session layout — only once connected */}
        {(sessionState === "connected" || sessionState === "ended") && (
          <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6 md:px-8">
            {/* Behavioral: media surface is positioned via the persistent container above */}

            {/* Technical: problem + editor fills the space, avatar is PiP */}
            {isTechnical && codingProblem && (
              <div className="flex min-h-0 flex-1 flex-col gap-4 pl-0 xl:pl-60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{scenario.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{codingProblem.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={syncCodeWithInterviewer}
                    disabled={sessionState !== "connected"}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      sessionState === "connected"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                        : "border-border bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <Sparkles className="size-3.5" />
                    Share code
                  </button>
                </div>

                <div className="min-h-0 flex-1">
                  <MonacoEditor
                    theme="vs-light"
                    defaultLanguage="typescript"
                    value={editorContent}
                    onChange={(value) => setEditorContent(value ?? "")}
                    options={{
                      automaticLayout: true,
                      fontSize: 14,
                      minimap: { enabled: false },
                      padding: { top: 12 },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                    }}
                    className="min-h-80 overflow-hidden rounded-2xl border border-border"
                  />
                </div>

                <div className="flex items-center gap-4">
                  {codingProblem.functionName && codingProblem.testCases && codingProblem.testCases.length > 0 && (
                    <CodeRunner
                      code={editorContent}
                      functionName={codingProblem.functionName}
                      testCases={codingProblem.testCases}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setEditorContent(buildDefaultEditorContent(scenario))}
                    className="ml-auto inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <RefreshCcw className="size-3.5" />
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* System Design: whiteboard fills the space, avatar is PiP */}
            {isSystemDesign && (
              <div className="flex min-h-0 flex-1 flex-col gap-4 pl-0 xl:pl-60">
                <div>
                  <h2 className="text-lg font-semibold">{scenario.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Draw your system architecture. The diagram will be captured for grading.
                  </p>
                </div>
                <div className="min-h-0 flex-1">
                  <WhiteboardPanel ref={whiteboardRef} />
                </div>
              </div>
            )}
          </section>
        )}

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
                    className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3"
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
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
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
