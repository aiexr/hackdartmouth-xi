"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Braces,
  Clock3,
  FileText,
  Lightbulb,
  MessageSquareText,
  Mic,
  MicOff,
  Minus,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  PhoneOff,
  RefreshCcw,
  Smile,
  Sparkles,
  Video,
  VideoOff,
  X,
  Flame,
} from "lucide-react";
import type { Scenario } from "@/data/scenarios";
import { LiveAvatar, type LiveAvatarHandle, type TranscriptEntry } from "@/components/app/live-avatar";
import { VoiceCall } from "@/components/app/voice-call";
import { CodeRunner } from "@/components/app/code-runner";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[24rem] items-center justify-center rounded-3xl border border-border bg-base-200/30 text-sm text-base-content/60">
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
      <div className="flex h-full min-h-[28rem] items-center justify-center rounded-3xl border border-border bg-base-200/30 text-sm text-base-content/60">
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
  const isBehavioral = scenario.category === "behavioral";
  const hasSplitView = isTechnical || isSystemDesign;

  const [panel, setPanel] = useState<PracticePanel>(isTechnical ? "hints" : "rubric");
  const [panelOpen, setPanelOpen] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [interviewMode, setInterviewMode] = useState<InterviewMode>(
    isTechnical ? "video" : "video",
  );
  const [interviewTone, setInterviewTone] = useState<InterviewTone>("neutral");
  const [sessionState, setSessionState] = useState<
    "idle" | "connecting" | "connected" | "ended"
  >("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const [editorContent, setEditorContent] = useState(() =>
    buildDefaultEditorContent(scenario),
  );
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [interviewerPrompt, setInterviewerPrompt] = useState<PracticePrompt>(null);
  const [lastCodeSyncLabel, setLastCodeSyncLabel] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [isPortalReady, setIsPortalReady] = useState(false);
  const whiteboardRef = useRef<WhiteboardHandle | null>(null);
  const avatarRef = useRef<LiveAvatarHandle | null>(null);
  const [avatarControls, setAvatarControls] = useState({ isMuted: false, isCameraOn: true });

  const sessionStartRef = useRef<number | null>(null);
  const initialPromptSentRef = useRef(false);

  useEffect(() => {
    if (!isTechnical) {
      return;
    }

    setInterviewMode("video");
  }, [isTechnical]);

  useEffect(() => {
    setIsPortalReady(true);
  }, []);

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
      if (isGrading) {
        return;
      }
      setIsGrading(true);

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

        router.push(`/review/${scenario.id}?interviewId=${id}`);
      } catch {
        router.push(`/review/${scenario.id}`);
      }
    },
    [
      editorContent,
      isGrading,
      isSystemDesign,
      isTechnical,
      router,
      scenario.category,
      scenario.difficulty,
      scenario.id,
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
        ref={avatarRef}
        compact={hasSplitView && (sessionState === "connected" || sessionState === "ended")}
        showStartButton={false}
        keepLargeLayout={isBehavioral}
        tone={interviewTone}
        promptRequest={interviewerPrompt}
        onTranscriptUpdate={setTranscript}
        onSessionEnd={handleSessionEnd}
        onStateChange={setSessionState}
        onControlsChange={hasSplitView ? setAvatarControls : undefined}
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
    <div className="flex min-h-screen flex-col bg-base-200">
      <header className="border-b border-border bg-base-100/75 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-base-content/60 transition hover:text-base-content">
            <X className="size-5" />
          </Link>

          <div className="flex min-w-0 items-center gap-4">
            <div className="text-sm text-base-content/60">
              {scenario.category === "technical"
                ? "Live coding round"
                : `${scenario.category.replace("-", " ")} round`}
            </div>
          </div>

          {hasSplitView && sessionState === "connected" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => avatarRef.current?.toggleMute()}
                className={cn(
                  "flex size-8 items-center justify-center rounded-none border transition hover:scale-105",
                  avatarControls.isMuted
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-base-300 bg-base-100 text-base-content hover:bg-base-200",
                )}
                title={avatarControls.isMuted ? "Unmute" : "Mute"}
              >
                {avatarControls.isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => avatarRef.current?.toggleCamera()}
                className={cn(
                  "flex size-8 items-center justify-center rounded-none border transition hover:scale-105",
                  !avatarControls.isCameraOn
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-base-300 bg-base-100 text-base-content hover:bg-base-200",
                )}
                title={avatarControls.isCameraOn ? "Turn off camera" : "Turn on camera"}
              >
                {avatarControls.isCameraOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => avatarRef.current?.stop()}
                className="flex items-center gap-1.5 rounded-none bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
              >
                <PhoneOff className="size-3.5" />
                End
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm font-semibold text-base-content/60">
            <Clock3 className="size-4" />
            <span className="tabular-nums">{formattedTime}</span>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {/* Pre-session screen (idle + connecting) — media surface flows inline */}
        {(sessionState === "idle" || sessionState === "connecting") && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:justify-center">
          <section className="flex flex-col items-center px-6 py-10 text-center">
            <div className="max-w-xl space-y-3">
              <p className="text-sm font-medium text-base-content/60">
                {scenario.interviewer} · {scenario.interviewerRole}
              </p>
              <h1 className="text-2xl md:text-3xl">{sessionTitle}</h1>
              <p className="text-base leading-7 text-base-content/60">
                {scenario.prompt}
              </p>
              {isTechnical && codingProblem && (
                <div className="mt-4 max-h-60 w-full overflow-y-auto rounded-none border border-border bg-base-100/60 p-4 text-left">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold">{codingProblem.sourceTitle}</span>
                    {codingProblem.sourceDifficulty && (
                      <span className={cn(
                        "text-[10px] font-medium",
                        codingProblem.sourceDifficulty === "Easy" ? "text-emerald-500" :
                        codingProblem.sourceDifficulty === "Medium" ? "text-amber-500" : "text-red-500",
                      )}>
                        {codingProblem.sourceDifficulty}
                      </span>
                    )}
                    {codingProblem.sourceUrl && (
                      <a href={codingProblem.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-[10px] text-base-content/40 transition hover:text-base-content/60"
                      >
                        <Braces className="size-3" />
                        LeetCode
                      </a>
                    )}
                  </div>
                  <p className="text-xs leading-5 text-base-content/70">{codingProblem.description}</p>
                  {codingProblem.examples.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {codingProblem.examples.map((ex, i) => (
                        <div key={i} className="rounded-none bg-base-200/70 px-3 py-2 font-mono text-[10px] leading-5">
                          <div><span className="font-semibold text-base-content/60">Input:</span> {ex.input}</div>
                          <div><span className="font-semibold text-base-content/60">Output:</span> {ex.output}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {resumed && (
                <div className="inline-flex items-center gap-2 rounded-none border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                  Resuming your previous session · {transcript.length} saved turn
                  {transcript.length === 1 ? "" : "s"}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              {!isTechnical && (
                <div className="flex items-center justify-center gap-2 rounded-none border border-border bg-base-100 p-1">
                  <button
                    type="button"
                    onClick={() => setInterviewMode("video")}
                    className={cn(
                      "flex items-center gap-2 rounded-none px-4 py-2 text-sm font-medium transition",
                      interviewMode === "video"
                        ? "bg-primary text-primary-content"
                        : "text-base-content/60 hover:text-base-content",
                    )}
                  >
                    <Video className="size-4" />
                    Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewMode("call")}
                    className={cn(
                      "flex items-center gap-2 rounded-none px-4 py-2 text-sm font-medium transition",
                      interviewMode === "call"
                        ? "bg-primary text-primary-content"
                        : "text-base-content/60 hover:text-base-content",
                    )}
                  >
                    <Phone className="size-4" />
                    Voice
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-base-content/60">Tone:</span>
                {toneOptions.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setInterviewTone(tone.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-xs font-medium transition",
                      interviewTone === tone.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent text-base-content/60 hover:bg-base-200 hover:text-base-content",
                    )}
                    title={tone.description}
                  >
                    <tone.icon className="size-3.5" />
                    {tone.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {scenario.focus.map((focus) => (
                  <span
                    key={focus}
                    className="rounded-none border border-border bg-base-100/75 px-3 py-1 text-sm font-medium text-base-content/85"
                  >
                    {focus}
                  </span>
                ))}
              </div>

              {interviewMode === "video" && (
                <button
                  type="button"
                  onClick={() => avatarRef.current?.start()}
                  disabled={sessionState !== "idle"}
                  className={cn(
                    "mt-3 flex items-center gap-2 rounded-none px-6 py-3 text-sm font-medium transition",
                    sessionState === "idle"
                      ? "bg-primary text-primary-content shadow-lg shadow-primary/25 hover:bg-primary/90"
                      : "bg-base-300 text-base-content/50",
                  )}
                >
                  <Phone className="size-4" />
                  {sessionState === "connecting" ? "Connecting..." : "Start Interview"}
                </button>
              )}
            </div>

          </section>
          </div>
        )}

        {/* Media surface — keep mounted across state changes to avoid teardown/reconnect loops */}
        <div
          className={cn(
            "z-20 overflow-hidden transition-all duration-500 ease-out",
            (sessionState === "idle" || sessionState === "connecting") &&
              cn(
                "w-full px-6 pt-6 pb-6 lg:self-center",
                interviewMode === "video" &&
                  (panelOpen
                    ? "mx-auto max-w-2xl"
                    : "mx-auto lg:ml-4 lg:mr-auto max-w-2xl lg:max-w-[54rem]"),
                interviewMode !== "video" && "mx-auto max-w-2xl",
              ),
            (sessionState === "connected" || sessionState === "ended") &&
              hasSplitView &&
              "absolute left-4 top-4 w-56 border border-base-300 bg-base-100 shadow-lg xl:w-64",
            (sessionState === "connected" || sessionState === "ended") &&
              isBehavioral &&
              interviewMode === "video" &&
              cn(
                "mt-6 w-full px-6 pb-6",
                panelOpen
                  ? "mx-auto max-w-2xl"
                  : "mx-auto lg:ml-4 lg:mr-auto max-w-2xl lg:max-w-[54rem]",
              ),
            (sessionState === "connected" || sessionState === "ended") &&
              !hasSplitView &&
              !isBehavioral &&
              "absolute inset-x-0 top-0 mx-auto w-full max-w-3xl p-6",
          )}
        >
          {mediaSurface}
        </div>

        {/* Active session layout — only once connected */}
        {(sessionState === "connected" || sessionState === "ended") && hasSplitView && (
          <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6 md:px-8">

            {/* Technical: problem + editor fills the space, avatar is PiP */}
            {isTechnical && codingProblem && (
              <div className="flex min-h-0 flex-1 flex-col gap-4 pl-0 xl:pl-60">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">{codingProblem.sourceTitle ?? scenario.title}</h2>
                      {codingProblem.sourceDifficulty && (
                        <span className={cn(
                          "text-xs font-medium",
                          codingProblem.sourceDifficulty === "Easy" ? "text-emerald-500" :
                          codingProblem.sourceDifficulty === "Medium" ? "text-amber-500" : "text-red-500",
                        )}>
                          {codingProblem.sourceDifficulty}
                        </span>
                      )}
                      {codingProblem.topicTags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-none border border-border bg-base-200/60 px-1.5 py-0.5 text-[10px] text-base-content/50">
                          {tag}
                        </span>
                      ))}
                      {codingProblem.sourceUrl && (
                        <a href={codingProblem.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-[10px] text-base-content/40 transition hover:text-base-content/60"
                        >
                          <Braces className="size-3" />
                          LeetCode
                        </a>
                      )}
                    </div>
                    <p className="text-sm leading-6 text-base-content/70">{codingProblem.description}</p>
                    {codingProblem.examples.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {codingProblem.examples.map((ex, i) => (
                          <div key={i} className="rounded-none bg-base-200/60 px-3 py-2 font-mono text-xs leading-5">
                            <div><span className="font-semibold text-base-content/60">Input:</span> {ex.input}</div>
                            <div><span className="font-semibold text-base-content/60">Output:</span> {ex.output}</div>
                            {ex.explanation && (
                              <div className="mt-0.5 text-base-content/50"><span className="font-semibold">Explanation:</span> {ex.explanation}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {codingProblem.constraints.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[10px] font-medium uppercase tracking-wider text-base-content/40 hover:text-base-content/60">
                          Constraints
                        </summary>
                        <ul className="mt-1 space-y-0.5 pl-3">
                          {codingProblem.constraints.map((c) => (
                            <li key={c} className="text-[10px] text-base-content/50 before:mr-1 before:content-['·']">{c}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={syncCodeWithInterviewer}
                    disabled={sessionState !== "connected"}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-none border px-3 py-1.5 text-xs font-medium transition",
                      sessionState === "connected"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                        : "border-border bg-base-200/40 text-base-content/60",
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
                    className="min-h-80 overflow-hidden rounded-none border border-border"
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
                    className="ml-auto inline-flex items-center gap-2 text-xs font-medium text-base-content/60 transition hover:text-base-content"
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
                  <p className="mt-1 text-sm text-base-content/60">
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

        <aside
          className={cn(
            "flex min-h-0 flex-col border-t border-border bg-base-100/85 backdrop-blur transition-all duration-200 lg:border-l lg:border-t-0",
            panelOpen ? "lg:w-[24rem] lg:overflow-y-auto" : "lg:w-10",
          )}
        >
          {/* Collapse / expand toggle */}
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            className="hidden items-center justify-center border-b border-base-300 py-2 text-base-content/60 transition hover:text-base-content lg:flex"
            title={panelOpen ? "Collapse panel" : "Expand panel"}
          >
            {panelOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
          </button>

          {panelOpen && (
            <>
              <div className="grid grid-cols-3 border-b border-base-300">
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
                        : "border-transparent text-base-content/60 hover:text-base-content",
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
                <p className="text-sm leading-6 text-base-content/60">
                  This round is scored against the visible rubric below.
                </p>
                {scenario.rubric.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-none bg-base-200/60 px-4 py-3"
                  >
                    <span className="text-sm font-medium">{item}</span>
                    <span className="text-xs font-medium text-base-content/60">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {panel === "hints" ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-base-content/60">
                  Keep these anchors visible while you answer.
                </p>
                {isTechnical && codingProblem?.sourceHints && codingProblem.sourceHints.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600">Algorithm hints</p>
                    {codingProblem.sourceHints.map((hint, index) => (
                      <div key={hint} className="flex gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-none bg-amber-100 text-xs font-semibold text-amber-700">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6">{hint}</p>
                      </div>
                    ))}
                  </div>
                )}
                {scenario.hints.length > 0 && (
                  <div className="space-y-3">
                    {isTechnical && codingProblem?.sourceHints && codingProblem.sourceHints.length > 0 && (
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-base-content/40">Interview coaching</p>
                    )}
                    {scenario.hints.map((hint, index) => (
                      <div key={hint} className="flex gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-none bg-amber-100 text-xs font-semibold text-amber-700">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6">{hint}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {panel === "transcript" ? (
              <div className="space-y-4">
                {transcript.length === 0 && (
                  <p className="text-sm text-base-content/60">
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
                          "flex items-center gap-2 text-[10px] text-base-content/60",
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
                            isUser ? "bg-primary/8" : "bg-base-200/70",
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
            </>
          )}
        </aside>
      </div>

      {isGrading && isPortalReady &&
        createPortal(
          <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-base-100/85 backdrop-blur-sm">
            <div className="flex w-[22rem] max-w-[90vw] flex-col items-center gap-4 rounded-none border border-border bg-base-100 p-6 text-center shadow-xl">
              <div className="relative flex items-center justify-center">
                <div className="absolute size-16 animate-ping rounded-full bg-primary/20" />
                <Loader2 className="relative size-9 animate-spin text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-base-content">Grading your interview</p>
                <p className="text-sm text-base-content/60">
                  Generating feedback and preparing your review page.
                </p>
              </div>
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="size-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.2s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.1s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-primary/70" />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
