"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Clock3, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HistorySession = {
  id: string;
  scenarioId: string | null;
  title: string;
  categoryLabel: string;
  trackLabel: string | null;
  difficultyLabel: string | null;
  completedAt: string | null;
  createdAt: string | null;
  overallScore: number | null;
  letterGrade: string | null;
  transcriptCount: number;
  reviewHref: string;
  scoreDelta: number | null;
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

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timeZone ?? "UTC",
    timeZoneName: "short",
  }).format(date);
}

function getSessionTone(score: number | null) {
  if (score === null) {
    return {
      label: "Pending",
      labelClassName: "text-amber-700",
      scoreClassName: "text-amber-700",
    };
  }

  if (score >= 85) {
    return {
      label: "Strong",
      labelClassName: "text-emerald-700",
      scoreClassName: "text-emerald-700",
    };
  }

  if (score >= 70) {
    return {
      label: "Solid",
      labelClassName: "text-sky-700",
      scoreClassName: "text-sky-700",
    };
  }

  return {
    label: "Review",
    labelClassName: "text-rose-700",
    scoreClassName: "text-rose-700",
  };
}

function getDeltaLabel(scoreDelta: number | null, overallScore: number | null) {
  if (overallScore === null) {
    return "Awaiting score";
  }

  if (scoreDelta === null) {
    return "First score";
  }

  if (scoreDelta === 0) {
    return "No change";
  }

  return `${scoreDelta > 0 ? "+" : ""}${scoreDelta} vs previous`;
}

function getDifficultyClassName(difficultyLabel: string | null) {
  switch (difficultyLabel?.toLowerCase()) {
    case "easy":
      return "text-emerald-600";
    case "medium":
      return "text-amber-600";
    case "hard":
      return "text-rose-600";
    default:
      return "text-base-content/55";
  }
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
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>History</CardTitle>
            <CardDescription>
              {signedIn
                ? `Open any completed session to review the scorecard and transcript${timeZone ? ` in ${timeZone}` : " in your local time zone"}.`
                : "Sign in to view your saved practice history."}
            </CardDescription>
          </div>
          {signedIn ? (
            <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-base-content/55">
              <span className="border border-base-300 px-2.5 py-1.5">
                {sessions.length} session{sessions.length === 1 ? "" : "s"}
              </span>
              <span className="border border-base-300 px-2.5 py-1.5">
                {timeZone ? `Local time · ${timeZone}` : "Local time"}
              </span>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {!signedIn ? (
          <div className="rounded-none border border-dashed border-base-300 px-4 py-6 text-sm text-base-content/60">
            Your previous practice sessions will appear here after you sign in and complete one.
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-none border border-dashed border-base-300 px-4 py-6 text-sm text-base-content/60">
            No completed sessions yet. Finish a practice session and it will appear here with its score and transcript.
          </div>
        ) : (
          <div className="card card-bordered overflow-hidden bg-base-100">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_12rem_7rem_7rem_5rem] items-center gap-3 border-b border-base-300 px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-base-content/50 md:grid">
              <span>Session</span>
              <span>Completed</span>
              <span className="justify-self-center">Score</span>
              <span className="justify-self-center">Transcript</span>
              <span className="justify-self-end">Review</span>
            </div>
            {sessions.map((session, index) => {
              const tone = getSessionTone(session.overallScore);
              const endedAt = formatEndedAt(session.completedAt, session.createdAt, timeZone);
              const transcriptLabel = `${session.transcriptCount} ${
                session.transcriptCount === 1 ? "entry" : "entries"
              }`;

              return (
                <Link
                  key={session.id}
                  href={session.reviewHref}
                  className={cn(
                    "group block transition hover:bg-base-200/50",
                    index < sessions.length - 1 && "border-b border-base-300/50",
                  )}
                >
                  <div className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1.5fr)_12rem_7rem_7rem_5rem] md:items-center md:gap-3 md:py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.16em] text-base-content/55">
                        <span>{session.categoryLabel}</span>
                        {session.trackLabel ? <span>{session.trackLabel}</span> : null}
                        {session.difficultyLabel ? (
                          <span
                            className={cn(
                              "font-semibold",
                              getDifficultyClassName(session.difficultyLabel),
                            )}
                          >
                            {session.difficultyLabel}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-1 truncate text-base font-semibold text-base-content">
                        {session.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/60 md:hidden">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="size-3.5" />
                          {endedAt}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="size-3.5" />
                          {transcriptLabel}
                        </span>
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-3 md:hidden">
                        <div>
                          <div
                            className={cn(
                              "text-lg font-semibold leading-none",
                              tone.scoreClassName,
                            )}
                          >
                            {session.overallScore ?? "—"}
                          </div>
                          <div
                            className={cn(
                              "mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                              tone.labelClassName,
                            )}
                          >
                            {session.letterGrade ? `${session.letterGrade} grade` : tone.label}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-base-content/55">
                            {getDeltaLabel(session.scoreDelta, session.overallScore)}
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.16em] text-base-content/55">
                            Open review
                            <ChevronRight className="size-4 text-base-content/35 transition group-hover:translate-x-0.5 group-hover:text-base-content/70" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="hidden text-sm leading-5 text-base-content/65 md:block">
                      {endedAt}
                    </div>

                    <div className="hidden md:block">
                      <div className="text-center">
                        <div
                          className={cn(
                            "text-xl font-semibold leading-none",
                            tone.scoreClassName,
                          )}
                        >
                          {session.overallScore ?? "—"}
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                            tone.labelClassName,
                          )}
                        >
                          {session.letterGrade ? `${session.letterGrade} grade` : tone.label}
                        </div>
                        <div className="mt-1 text-[11px] text-base-content/50">
                          {getDeltaLabel(session.scoreDelta, session.overallScore)}
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:block">
                      <div className="text-center text-sm font-medium text-base-content">
                        {session.transcriptCount}
                      </div>
                      <div className="mt-1 text-center text-[10px] uppercase tracking-[0.16em] text-base-content/50">
                        {session.transcriptCount === 1 ? "entry" : "entries"}
                      </div>
                    </div>

                    <div className="hidden items-center justify-self-end gap-1 text-[11px] font-medium uppercase tracking-[0.16em] text-base-content/55 md:flex">
                      Open
                      <ChevronRight className="size-4 text-base-content/35 transition group-hover:translate-x-0.5 group-hover:text-base-content/70" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
