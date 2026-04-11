"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceConversation } from "@elevenlabs/client";
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

type VoiceCallProps = {
  tone?: string;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  onSessionEnd?: (transcript: TranscriptEntry[]) => void;
  onStateChange?: (state: "idle" | "connecting" | "connected" | "ended") => void;
};

export function VoiceCall({
  tone = "neutral",
  onTranscriptUpdate,
  onSessionEnd,
  onStateChange,
}: VoiceCallProps) {
  const conversationRef = useRef<VoiceConversation | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
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

  const updateTranscript = useCallback(
    (role: "user" | "interviewer", rawContent: string, partial: boolean) => {
      const trimmed = rawContent.replace(/\(.*?\)/g, "").replace(/\s{2,}/g, " ").trim();
      if (!trimmed) return;
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

      const conversation = await VoiceConversation.startSession({
        agentId,
        onConnect: () => {
          updateStatus("connected");
        },
        onDisconnect: () => {
          updateStatus("ended");
          onSessionEnd?.(transcriptRef.current);
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
      const contextualUpdate = resumeContext
        ? `${tonePrompt}\n\nCandidate resume context:\n${resumeContext}`
        : tonePrompt;
      conversation.sendContextualUpdate(contextualUpdate);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start call";
      setError(message);
      updateStatus("idle");
    }
  }, [updateStatus, updateTranscript, onSessionEnd, tone]);

  const endCall = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    updateStatus("ended");
    onSessionEnd?.(transcriptRef.current);
  }, [updateStatus, onSessionEnd]);

  const toggleMute = useCallback(() => {
    if (!conversationRef.current) return;
    const newMuted = !isMuted;
    conversationRef.current.setMicMuted(newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => {});
        conversationRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Audio visualization area */}
      <div className="flex aspect-video w-full max-w-2xl items-center justify-center rounded-2xl bg-black/5 shadow-lg">
        {status === "idle" && (
          <p className="text-sm text-muted-foreground">
            Start a voice call with your interviewer
          </p>
        )}

        {status === "connecting" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Connecting...</p>
          </div>
        )}

        {status === "connected" && (
          <div className="flex flex-col items-center gap-4">
            {/* Speaking indicator */}
            <div
              className={cn(
                "flex size-24 items-center justify-center rounded-full transition-all duration-300",
                agentSpeaking
                  ? "bg-primary/20 ring-4 ring-primary/30 scale-110"
                  : "bg-muted",
              )}
            >
              <div
                className={cn(
                  "flex size-16 items-center justify-center rounded-full transition-all",
                  agentSpeaking ? "bg-primary text-white" : "bg-muted-foreground/20 text-muted-foreground",
                )}
              >
                <Phone className="size-7" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {agentSpeaking ? "Interviewer is speaking..." : "Listening..."}
            </p>
            {/* Audio bars */}
            <div className="flex items-end gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 rounded-full transition-all",
                    agentSpeaking ? "bg-primary animate-pulse" : "bg-muted-foreground/30",
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
          <p className="text-sm text-muted-foreground">Call ended</p>
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
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
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
                "flex size-12 items-center justify-center rounded-full shadow-md transition hover:scale-105",
                isMuted ? "bg-red-500 text-white" : "bg-white text-foreground",
              )}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </button>

            <button
              onClick={endCall}
              className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-red-500/25 transition hover:bg-red-600"
            >
              <PhoneOff className="size-4" />
              End Call
            </button>
          </>
        )}

        {status === "connecting" && (
          <button
            disabled
            className="flex items-center gap-2 rounded-full bg-muted px-6 py-3 text-sm font-medium text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" />
            Connecting...
          </button>
        )}
      </div>
    </div>
  );
}
