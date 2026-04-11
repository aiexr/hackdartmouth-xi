"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LiveAvatarSession,
  AgentEventsEnum,
  SessionEvent,
  SessionState,
} from "@heygen/liveavatar-web-sdk";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TranscriptEntry = {
  id: string;
  role: "user" | "interviewer";
  content: string;
  timestamp: Date;
  partial?: boolean;
};

type TranscriptRole = TranscriptEntry["role"];

type LiveAvatarProps = {
  tone?: string;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  onSessionEnd?: (transcript: TranscriptEntry[]) => void;
  onStateChange?: (state: "idle" | "connecting" | "connected" | "ended") => void;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export function LiveAvatar({
  tone = "neutral",
  onTranscriptUpdate,
  onSessionEnd,
  onStateChange,
}: LiveAvatarProps) {
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const userStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const activePartialIdRef = useRef<Record<TranscriptRole, string | null>>({
    user: null,
    interviewer: null,
  });

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);

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

  const flushPartial = useCallback(
    (role: TranscriptRole) => {
      const partialId = activePartialIdRef.current[role];
      if (!partialId) return;

      const entries = [...transcriptRef.current];
      const index = entries.findIndex((entry) => entry.id === partialId);

      if (index >= 0) {
        const entry = entries[index];
        entries[index] = {
          ...entry,
          content: entry.content.trim(),
          partial: undefined,
          timestamp: new Date(),
        };
        transcriptRef.current = entries;
        onTranscriptUpdate?.(entries);
      }

      activePartialIdRef.current[role] = null;
    },
    [onTranscriptUpdate],
  );

  const startUserCamera = useCallback(async () => {
    if (userStreamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      userStreamRef.current = stream;
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }
    } catch {
      // camera denied
    }
  }, []);

  const startSession = useCallback(async () => {
    setError(null);
    updateStatus("connecting");

    await startUserCamera();

    try {
      const res = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "video", tone }),
      });

      if (!res.ok) {
        const data = asRecord(await res.json());
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to create session",
        );
      }

      const data = asRecord(await res.json());
      const nestedData = asRecord(data.data);
      const token =
        (typeof nestedData.session_token === "string" ? nestedData.session_token : null) ||
        (typeof data.session_token === "string" ? data.session_token : null) ||
        (typeof data.token === "string" ? data.token : null) ||
        (typeof data.access_token === "string" ? data.access_token : null);

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

      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        if (avatarVideoRef.current) {
          session.attach(avatarVideoRef.current);
          avatarVideoRef.current.play().catch(() => {});
        }
      });

      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => setAvatarSpeaking(true));
      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
        setAvatarSpeaking(false);
        flushPartial("interviewer");
      });
      session.on(AgentEventsEnum.USER_SPEAK_STARTED, () => setUserSpeaking(true));
      session.on(AgentEventsEnum.USER_SPEAK_ENDED, () => {
        setUserSpeaking(false);
        flushPartial("user");
      });

      session.on(AgentEventsEnum.USER_TRANSCRIPTION_CHUNK, (event: { text: string }) => {
        updateTranscript("user", event.text, true);
      });

      session.on(AgentEventsEnum.USER_TRANSCRIPTION, (event: { text: string }) => {
        updateTranscript("user", event.text, false);
      });

      session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION_CHUNK, (event: { text: string }) => {
        updateTranscript("interviewer", event.text, true);
      });

      session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (event: { text: string }) => {
        updateTranscript("interviewer", event.text, false);
      });

      if (avatarVideoRef.current) {
        session.attach(avatarVideoRef.current);
      }

      await session.start();
      sessionRef.current = session;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start session";
      setError(message);
      updateStatus("idle");
    }
  }, [flushPartial, updateStatus, updateTranscript, onSessionEnd, startUserCamera]);

  const stopSession = useCallback(async () => {
    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach((t) => t.stop());
      userStreamRef.current = null;
    }
    if (sessionRef.current) {
      try {
        await sessionRef.current.stop();
      } catch {
        // session may already be stopped
      }
      sessionRef.current = null;
    }
    flushPartial("user");
    flushPartial("interviewer");
    updateStatus("ended");
    onSessionEnd?.(transcriptRef.current);
  }, [flushPartial, updateStatus, onSessionEnd]);

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

  const toggleCamera = useCallback(() => {
    const stream = userStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCameraOn(track.enabled);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((t) => t.stop());
        userStreamRef.current = null;
      }
      if (sessionRef.current) {
        sessionRef.current.stop().catch(() => {});
        sessionRef.current = null;
      }
    };
  }, []);

  const isActive = status === "connected";
  const isPreSession = status === "idle" || status === "connecting";

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Video grid -- always rendered, always 2 columns so refs stay stable */}
      <div className="grid w-full grid-cols-2 gap-3">
        {/* Interviewer (avatar) tile */}
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-lg">
          <video
            ref={avatarVideoRef}
            autoPlay
            playsInline
            className="aspect-video size-full object-cover"
          />
          {/* Overlay when not yet connected */}
          {isPreSession && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
              {status === "connecting" ? (
                <>
                  <Loader2 className="size-8 animate-spin text-white/60" />
                  <p className="mt-2 text-sm text-white/50">Interviewer joining...</p>
                </>
              ) : (
                <p className="text-sm text-white/30">Interviewer</p>
              )}
            </div>
          )}
          {(isActive || status === "ended") && (
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-t",
                avatarSpeaking ? "from-primary/40" : "from-black/50",
              )}
            >
              <span className="text-sm font-medium text-white">Interviewer</span>
              {avatarSpeaking && (
                <span className="flex items-center gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block w-0.5 animate-pulse rounded-full bg-white"
                      style={{ height: 8 + (i % 2) * 6, animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
              )}
            </div>
          )}
          {status === "ended" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <p className="text-sm text-white/70">Interview ended</p>
            </div>
          )}
        </div>

        {/* User (webcam) tile */}
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-lg">
          <video
            ref={userVideoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "aspect-video size-full object-cover",
              !isCameraOn && "hidden",
            )}
          />
          {!isCameraOn && (
            <div className="flex aspect-video size-full items-center justify-center bg-muted">
              <VideoOff className="size-8 text-muted-foreground" />
            </div>
          )}

          {/* Overlay for pre-session states */}
          {status === "connecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
              <Loader2 className="size-10 animate-spin text-white" />
              <p className="mt-3 text-sm font-medium text-white">
                Connecting to your interviewer...
              </p>
            </div>
          )}

          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-t",
              userSpeaking ? "from-primary/40" : "from-black/50",
            )}
          >
            <span className="text-sm font-medium text-white">You</span>
            {isMuted && <MicOff className="size-3 text-red-400" />}
            {userSpeaking && !isMuted && (
              <span className="flex items-center gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block w-0.5 animate-pulse rounded-full bg-white"
                    style={{ height: 8 + (i % 2) * 6, animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="max-w-md text-center text-sm text-red-500">{error}</p>
      )}

      {/* Control bar */}
      <div className="flex items-center justify-center gap-3">
        {status === "idle" && (
          <button
            onClick={startSession}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
          >
            <Phone className="size-4" />
            Start Interview
          </button>
        )}

        {isActive && (
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
              onClick={toggleCamera}
              className={cn(
                "flex size-12 items-center justify-center rounded-full shadow-md transition hover:scale-105",
                !isCameraOn ? "bg-red-500 text-white" : "bg-white text-foreground",
              )}
              title={isCameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {isCameraOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
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
