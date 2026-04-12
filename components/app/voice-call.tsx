"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { VoiceConversation } from "@elevenlabs/client";
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const INTERNAL_PROMPT_MARKER = "[[internal-interviewer-context]]";

export type TranscriptEntry = {
  id: string;
  role: "user" | "interviewer";
  content: string;
  timestamp: Date;
  partial?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

const TONE_PROMPTS: Record<string, string> = {
  friendly:
    "Adopt a warm, encouraging interview style. Be patient, give the candidate time to think, acknowledge good points with brief positive feedback, and gently push for specifics. Start with a friendly greeting.",
  neutral:
    "Conduct the interview in a standard professional manner. Be fair, ask one question at a time, and probe for specifics when answers are vague.",
  tough:
    "Adopt a demanding, no-nonsense interview style. Be direct and skeptical. Challenge vague answers immediately. Push back on every response. Never praise. Test composure with unexpected follow-ups. Start with a hard question right away.",
};

type TranscriptRole = TranscriptEntry["role"];

export type VoiceCallHandle = {
  stop: () => Promise<void>;
};

type VoiceCallProps = {
  tone?: string;
  promptRequest?: { id: string; text: string } | null;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  onSessionEnd?: (transcript: TranscriptEntry[]) => void;
  onStateChange?: (state: "idle" | "connecting" | "connected" | "ended") => void;
};

export const VoiceCall = forwardRef<VoiceCallHandle, VoiceCallProps>(function VoiceCall({
  tone = "neutral",
  promptRequest,
  onTranscriptUpdate,
  onSessionEnd,
  onStateChange,
}, ref) {
  const conversationRef = useRef<VoiceConversation | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const lastPromptIdRef = useRef<string | null>(null);
  const deliveredPromptTextsRef = useRef<Set<string>>(new Set());
  const sessionEndDeliveredRef = useRef(false);
  const activePartialIdRef = useRef<Record<TranscriptRole, string | null>>({
    user: null,
    interviewer: null,
  });

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentSpeaking, setAgentSpeaking] = useState(false);

  const updateStatus = useCallback(
    (newStatus: "idle" | "connecting" | "connected" | "ended") => {
      setStatus(newStatus);
      onStateChange?.(newStatus);
    },
    [onStateChange],
  );

  const emitSessionEnd = useCallback(() => {
    if (sessionEndDeliveredRef.current) {
      return;
    }

    sessionEndDeliveredRef.current = true;
    onSessionEnd?.(transcriptRef.current);
  }, [onSessionEnd]);

  const updateTranscript = useCallback(
    (role: "user" | "interviewer", rawContent: string, partial: boolean) => {
      const trimmed = rawContent.replace(/\(.*?\)/g, "").replace(/\s{2,}/g, " ").trim();
      if (!trimmed) return;
      if (role === "user" && trimmed.includes(INTERNAL_PROMPT_MARKER)) return;
      const entries = [...transcriptRef.current];
      const activePartialId = activePartialIdRef.current[role];
      const activePartialIndex = activePartialId
        ? entries.findIndex((entry) => entry.id === activePartialId)
        : -1;

      const createEntry = (entryPartial: boolean): TranscriptEntry => ({
        id: crypto.randomUUID(),
        role,
        content: trimmed,
        timestamp: new Date(),
        partial: entryPartial ? true : undefined,
      });

      const dedupeWithPrevious = (index: number) => {
        if (index <= 0) return;
        const current = entries[index];
        const previous = entries[index - 1];
        if (
          previous &&
          current &&
          !previous.partial &&
          !current.partial &&
          previous.role === current.role &&
          previous.content === current.content
        ) {
          entries.splice(index, 1);
        }
      };

      if (partial) {
        if (activePartialIndex >= 0) {
          entries[activePartialIndex] = {
            ...entries[activePartialIndex],
            content: trimmed,
            timestamp: new Date(),
          };
        } else {
          const entry = createEntry(true);
          entries.push(entry);
          activePartialIdRef.current[role] = entry.id;
        }
      } else {
        if (activePartialIndex >= 0) {
          entries[activePartialIndex] = {
            ...entries[activePartialIndex],
            content: trimmed,
            timestamp: new Date(),
            partial: undefined,
          };
          dedupeWithPrevious(activePartialIndex);
        } else {
          const entry = createEntry(false);
          entries.push(entry);
          dedupeWithPrevious(entries.length - 1);
        }
        activePartialIdRef.current[role] = null;
      }

      transcriptRef.current = entries;
      onTranscriptUpdate?.(entries);
    },
    [onTranscriptUpdate],
  );

  const startCall = useCallback(async () => {
    setError(null);
    sessionEndDeliveredRef.current = false;
    updateStatus("connecting");

    try {
      const res = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "call" }),
      });

      if (!res.ok) {
        const data = asRecord(await res.json());
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to get agent config",
        );
      }

      const data = asRecord(await res.json());
      const agentId = typeof data.agentId === "string" ? data.agentId : "";
      if (!agentId) {
        throw new Error("Missing ElevenLabs agent id");
      }
      const resumeContext = typeof data.resumeContext === "string" ? data.resumeContext : "";
      const candidateName =
        typeof data.candidateName === "string"
          ? data.candidateName.replace(/\s+/g, " ").trim()
          : "";

      const conversation = await VoiceConversation.startSession({
        agentId,
        onConnect: () => {
          lastPromptIdRef.current = null;
          deliveredPromptTextsRef.current.clear();
          updateStatus("connected");
        },
        onDisconnect: () => {
          updateStatus("ended");
          emitSessionEnd();
        },
        onModeChange: (mode) => {
          setAgentSpeaking(mode.mode === "speaking");
        },
        onMessage: (message) => {
          if (message.source === "user") {
            updateTranscript("user", message.message, false);
          } else if (message.source === "ai") {
            updateTranscript("interviewer", message.message, false);
          }
        },
        onError: (err) => {
          setError(typeof err === "string" ? err : "Connection error");
        },
      });

      conversationRef.current = conversation;

      // Inject tone modifier into the agent's context
      const tonePrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS.neutral;
      const contextualSections = [tonePrompt];
      contextualSections.push(
        candidateName
          ? `The candidate's name is ${candidateName}. If you address them by name, use exactly "${candidateName}". Never use placeholders like [Candidate Name] or [Name].`
          : "Do not use placeholders like [Candidate Name] or [Name]. If you do not know the candidate's name, greet them without using a name.",
      );
      if (resumeContext) {
        contextualSections.push(`Candidate resume context:\n${resumeContext}`);
      }
      const contextualUpdate = contextualSections.join("\n\n");
      conversation.sendContextualUpdate(contextualUpdate);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start call";
      setError(message);
      updateStatus("idle");
    }
  }, [emitSessionEnd, updateStatus, updateTranscript, tone]);

  const endCall = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    updateStatus("ended");
    emitSessionEnd();
  }, [emitSessionEnd, updateStatus]);

  const toggleMute = useCallback(() => {
    if (!conversationRef.current) return;
    const newMuted = !isMuted;
    conversationRef.current.setMicMuted(newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  useImperativeHandle(ref, () => ({
    stop: endCall,
  }), [endCall]);

  useEffect(() => {
    if (!promptRequest || status !== "connected" || !conversationRef.current) {
      return;
    }

    if (lastPromptIdRef.current === promptRequest.id) {
      return;
    }

    if (deliveredPromptTextsRef.current.has(promptRequest.text)) {
      return;
    }

    lastPromptIdRef.current = promptRequest.id;
    deliveredPromptTextsRef.current.add(promptRequest.text);
    conversationRef.current.sendContextualUpdate(promptRequest.text);
  }, [promptRequest, status]);

  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => {});
        conversationRef.current = null;
      }
      deliveredPromptTextsRef.current.clear();
    };
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Audio visualization area */}
      <div className="flex aspect-video w-full max-w-2xl items-center justify-center rounded-none bg-black/5 shadow-lg">
        {status === "idle" && (
          <p className="text-sm text-base-content/60">
            Start a voice call with your interviewer
          </p>
        )}

        {status === "connecting" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-base-content/60">Connecting...</p>
          </div>
        )}

        {status === "connected" && (
          <div className="flex flex-col items-center gap-4">
            {/* Speaking indicator */}
            <div
              className={cn(
                "flex size-24 items-center justify-center rounded-none transition-all duration-300",
                agentSpeaking
                  ? "bg-primary/20 ring-4 ring-primary/30 scale-110"
                  : "bg-base-200",
              )}
            >
              <div
                className={cn(
                  "flex size-16 items-center justify-center rounded-none transition-all",
                  agentSpeaking ? "bg-primary text-white" : "bg-base-200-foreground/20 text-base-content/60",
                )}
              >
                <Phone className="size-7" />
              </div>
            </div>
            <p className="text-sm font-medium text-base-content/60">
              {agentSpeaking ? "Interviewer is speaking..." : "Listening..."}
            </p>
            {/* Audio bars */}
            <div className="flex items-end gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 rounded-none transition-all",
                    agentSpeaking ? "bg-primary animate-pulse" : "bg-base-200-foreground/30",
                  )}
                  style={{
                    height: agentSpeaking ? 12 + Math.sin(i * 0.8) * 16 : 8,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {status === "ended" && (
          <p className="text-sm text-base-content/60">Call ended</p>
        )}
      </div>

      {error && (
        <p className="max-w-md text-center text-sm text-red-500">{error}</p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {status === "idle" && (
          <button
            onClick={startCall}
            className="flex items-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-medium text-primary-content shadow-lg shadow-primary/25 transition hover:bg-primary/90"
          >
            <Phone className="size-4" />
            Start Call
          </button>
        )}

        {status === "connected" && (
          <>
            <button
              onClick={toggleMute}
              className={cn(
                "flex size-12 items-center justify-center rounded-none border shadow-md transition hover:scale-105",
                isMuted
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-base-300 bg-base-100 text-base-content hover:bg-base-200",
              )}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </button>

            <button
              onClick={endCall}
              className="flex items-center gap-2 rounded-none bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-red-500/25 transition hover:bg-red-600"
            >
              <PhoneOff className="size-4" />
              End Call
            </button>
          </>
        )}

        {status === "connecting" && (
          <button
            disabled
            className="flex items-center gap-2 rounded-none bg-base-200 px-6 py-3 text-sm font-medium text-base-content/60"
          >
            <Loader2 className="size-4 animate-spin" />
            Connecting...
          </button>
        )}
      </div>
    </div>
  );
});
