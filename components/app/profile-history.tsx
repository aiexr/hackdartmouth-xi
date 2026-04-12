"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type HistoryTranscriptEntry = {
  id: string;
  role: string;
  content: string;
  timestamp: string | null;
};

type HistorySession = {
  id: string;
  scenarioId: string | null;
  completedAt: string | null;
  createdAt: string | null;
  overallScore: number | null;
  transcript: HistoryTranscriptEntry[];
};

function formatEndedAt(
  completedAt: string | null,
  createdAt: string | null,
  timeZone: string | null,
) {
  const source = completedAt ?? createdAt;
  if (!source) {
    return "Ended time unavailable";
  }

  const date = new Date(source);
  if (Number.isNaN(date.getTime())) {
    return "Ended time unavailable";
  }

  if (!timeZone) {
    return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(date);
}

function formatRole(role: string) {
  const normalized = role.trim().toLowerCase();

  if (normalized === "user" || normalized === "candidate") {
    return "You";
  }

  if (normalized === "interviewer" || normalized === "assistant") {
    return "Interviewer";
  }

  return role || "Speaker";
}

export function ProfileHistory({
  signedIn,
  sessions,
}: {
  signedIn: boolean;
  sessions: HistorySession[];
}) {
  const [timeZone, setTimeZone] = useState<string | null>(null);

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || null);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>
          {signedIn
            ? `Saved transcripts from your completed sessions. End times are shown in your local time zone${timeZone ? ` (${timeZone})` : ""}.`
            : "Sign in to view your saved session transcripts."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!signedIn ? (
          <p className="text-sm text-base-content/60">
            Your previous practice sessions will appear here after you sign in and complete one.
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-base-content/60">
            No completed sessions yet. Finish a practice session and its transcript will show up here.
          </p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <section
                key={session.id}
                className="rounded-none border border-border bg-base-100"
              >
                <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-base-content">Practice session</p>
                    <p className="text-xs text-base-content/60">
                      Ended {formatEndedAt(session.completedAt, session.createdAt, timeZone)}
                    </p>
                    {session.scenarioId ? (
                      <p className="mt-1 text-xs text-base-content/50">
                        Scenario: {session.scenarioId}
                      </p>
                    ) : null}
                  </div>
                  {session.overallScore !== null ? (
                    <div className="text-xs font-medium text-base-content/70">
                      Score {session.overallScore}
                    </div>
                  ) : null}
                </div>

                <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
                  {session.transcript.length === 0 ? (
                    <p className="text-sm text-base-content/60">
                      This session ended without any saved transcript lines.
                    </p>
                  ) : (
                    session.transcript.map((entry) => (
                      <div key={entry.id} className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-base-content/50">
                          {formatRole(entry.role)}
                        </p>
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-base-content/80">
                          {entry.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
