"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LiveAvatarSession,
  AgentEventsEnum,
  SessionEvent,
  SessionState,
} from "@heygen/liveavatar-web-sdk";
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TranscriptEntry = {
  role: "user" | "interviewer";
  content: string;
  timestamp: Date;
};

type LiveAvatarProps = {
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  onSessionEnd?: (transcript: TranscriptEntry[]) => void;
  onStateChange?: (state: "idle" | "connecting" | "connected" | "ended") => void;
};

export function LiveAvatar({
  onTranscriptUpdate,
  onSessionEnd,
  onStateChange,
}: LiveAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    (newStatus: "idle" | "connecting" | "connected" | "ended") => {
      setStatus(newStatus);
      onStateChange?.(newStatus);
    },
    [onStateChange],
  );

  const addTranscriptEntry = useCallback(
    (role: "user" | "interviewer", content: string) => {
      if (!content.trim()) return;
      const entry: TranscriptEntry = { role, content: content.trim(), timestamp: new Date() };
      transcriptRef.current = [...transcriptRef.current, entry];
      onTranscriptUpdate?.(transcriptRef.current);
    },
    [onTranscriptUpdate],
  );

  const startSession = useCallback(async () => {
    setError(null);
    updateStatus("connecting");

    try {
      const res = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elevenlabsSecretId: process.env.NEXT_PUBLIC_ELEVENLABS_SECRET_ID,
          elevenlabsAgentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create session");
      }

      const data = await res.json();
      const token = data.session_token || data.token || data.access_token;

      if (!token) {
        throw new Error("No session token received");
      }

      const session = new LiveAvatarSession(token, {
        voiceChat: true,
      });

      session.on(SessionEvent.SESSION_STATE_CHANGED, (state: SessionState) => {
        if (state === SessionState.CONNECTED) {
          updateStatus("connected");
        } else if (state === SessionState.DISCONNECTED) {
          updateStatus("ended");
          onSessionEnd?.(transcriptRef.current);
        }
      });

      session.on(AgentEventsEnum.USER_TRANSCRIPTION, (event: { text: string }) => {
        addTranscriptEntry("user", event.text);
      });

      session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (event: { text: string }) => {
        addTranscriptEntry("interviewer", event.text);
      });

      await session.start();

      if (videoRef.current) {
        session.attach(videoRef.current);
      }

      sessionRef.current = session;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start session";
      setError(message);
      updateStatus("idle");
    }
  }, [updateStatus, addTranscriptEntry, onSessionEnd]);

  const stopSession = useCallback(async () => {
    if (sessionRef.current) {
      try {
        await sessionRef.current.stop();
      } catch {
        // session may already be stopped
      }
      sessionRef.current = null;
    }
    updateStatus("ended");
    onSessionEnd?.(transcriptRef.current);
  }, [updateStatus, onSessionEnd]);

  const toggleMute = useCallback(async () => {
    const session = sessionRef.current;
    if (!session?.voiceChat) return;

    if (isMuted) {
      await session.voiceChat.unmute();
      setIsMuted(false);
    } else {
      await session.voiceChat.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop().catch(() => {});
        sessionRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-3xl bg-black/5 shadow-xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={cn(
            "size-full object-cover",
            status !== "connected" && "hidden",
          )}
        />

        {status === "idle" && (
          <div className="flex size-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Start the session to begin your interview
            </p>
          </div>
        )}

        {status === "connecting" && (
          <div className="flex size-full flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Connecting to interviewer...
            </p>
          </div>
        )}

        {status === "ended" && (
          <div className="flex size-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Interview session ended
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="max-w-md text-center text-sm text-red-500">{error}</p>
      )}

      <div className="flex items-center gap-4">
        {status === "idle" && (
          <button
            onClick={startSession}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
          >
            <Phone className="size-4" />
            Start Interview
          </button>
        )}

        {status === "connected" && (
          <>
            <button
              onClick={toggleMute}
              className={cn(
                "flex size-12 items-center justify-center rounded-full shadow-md transition hover:scale-[1.02]",
                isMuted
                  ? "bg-red-100 text-red-600"
                  : "bg-white text-muted-foreground",
              )}
            >
              {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </button>

            <button
              onClick={stopSession}
              className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-red-500/25 transition hover:bg-red-600"
            >
              <PhoneOff className="size-4" />
              End Interview
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
