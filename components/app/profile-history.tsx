"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronRight, Clock3, FileText } from "lucide-react";
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

function getSessionTone(score: number | null) {
  if (score === null) {
    return {
      label: "Pending",
      rowClassName: "border-amber-300/70 bg-gradient-to-r from-amber-100/80 via-base-100 to-base-100",
      labelClassName: "text-amber-700",
      scoreClassName: "text-amber-700",
    };
  }

  if (score >= 85) {
    return {
      label: "Strong",
      rowClassName: "border-emerald-300/70 bg-gradient-to-r from-emerald-100/85 via-cyan-50/70 to-base-100",
      labelClassName: "text-emerald-700",
      scoreClassName: "text-emerald-700",
    };
  }

  if (score >= 70) {
    return {
      label: "Solid",
      rowClassName: "border-sky-300/70 bg-gradient-to-r from-sky-100/85 via-cyan-50/70 to-base-100",
      labelClassName: "text-sky-700",
      scoreClassName: "text-sky-700",
    };
  }

  return {
    label: "Review",
    rowClassName: "border-rose-300/70 bg-gradient-to-r from-rose-100/85 via-orange-50/70 to-base-100",
    labelClassName: "text-rose-700",
    scoreClassName: "text-rose-700",
  };
}

function getDeltaLabel(scoreDelta: number | null, overallScore: number | null) {
  if (overallScore === null) {
    return "Transcript saved";
  }

  if (scoreDelta === null) {
    return "First scored attempt";
  }

  if (scoreDelta === 0) {
    return "No score change";
  }

  return `${scoreDelta > 0 ? "+" : ""}${scoreDelta} vs last attempt`;
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
            ? `Completed sessions are listed like a match history. Open any entry to see the scorecard and full transcript in your local time zone${timeZone ? ` (${timeZone})` : ""}.`
            : "Sign in to view your saved practice history."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!signedIn ? (
          <p className="text-sm text-base-content/60">
            Your previous practice sessions will appear here after you sign in and complete one.
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-base-content/60">
            No completed sessions yet. Finish a practice session and it will appear here with its score and review link.
          </p>
        ) : (
          <div className="overflow-hidden rounded-none border border-border bg-base-100">
            <div className="hidden grid-cols-[minmax(0,1.6fr)_180px_200px] border-b border-border bg-base-200/40 px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.18em] text-base-content/50 md:grid">
              <span>Session</span>
              <span className="text-center">Result</span>
              <span className="text-right">Review</span>
            </div>
            {sessions.map((session, index) => {
              const tone = getSessionTone(session.overallScore);

              return (
                <Link
                  key={session.id}
                  href={session.reviewHref}
                  className={cn(
                    "group grid gap-4 px-4 py-4 transition hover:bg-base-200/25 md:grid-cols-[minmax(0,1.6fr)_180px_200px] md:items-center",
                    tone.rowClassName,
                    index < sessions.length - 1 && "border-b border-border/70",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.16em] text-base-content/55">
                      <span>{session.categoryLabel}</span>
                      {session.difficultyLabel ? <span>{session.difficultyLabel}</span> : null}
                    </div>
                    <h3 className="mt-2 truncate text-base font-semibold text-base-content">
                      {session.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/65">
                      {session.trackLabel ? <span>{session.trackLabel}</span> : null}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="size-3.5" />
                        {formatEndedAt(session.completedAt, session.createdAt, timeZone)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="size-3.5" />
                        {session.transcriptCount} transcript{" "}
                        {session.transcriptCount === 1 ? "entry" : "entries"}
                      </span>
                    </div>
                  </div>

                  <div className="md:text-center">
                    <div
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-[0.24em]",
                        tone.labelClassName,
                      )}
                    >
                      {tone.label}
                    </div>
                    <div
                      className={cn(
                        "mt-2 text-3xl font-semibold leading-none",
                        tone.scoreClassName,
                      )}
                    >
                      {session.overallScore ?? "—"}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-base-content/50">
                      {session.letterGrade
                        ? `${session.letterGrade} grade`
                        : session.overallScore !== null
                          ? "score"
                          : "awaiting score"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <div className="text-left md:text-right">
                      <div className="text-sm font-medium text-base-content">
                        {getDeltaLabel(session.scoreDelta, session.overallScore)}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-base-content/55">
                        Open review
                        <ArrowUpRight className="size-3.5" />
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-base-content/35 transition group-hover:translate-x-0.5 group-hover:text-base-content/70" />
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
