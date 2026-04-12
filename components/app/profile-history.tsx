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
  gradingError: string | null;
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
    return `${date.toISOString().replace("T", " ").slice(0, 16)} UTC`;
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

function getSessionStatus(session: HistorySession) {
  if (session.overallScore !== null) {
    const badgeClassName =
      session.overallScore >= 85
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
        : session.overallScore >= 70
          ? "border-sky-500/20 bg-sky-500/10 text-sky-600"
          : session.overallScore >= 55
            ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
            : "border-rose-500/20 bg-rose-500/10 text-rose-600";

    return {
      badgeLabel: `${session.overallScore}`,
      badgeClassName,
      summary: session.scoreDelta === null
        ? "Performance grading available"
        : `${session.scoreDelta > 0 ? "+" : ""}${session.scoreDelta} vs last attempt`,
    };
  }

  if (session.gradingError) {
    return {
      badgeLabel: "Failed",
      badgeClassName:
        "border-amber-500/20 bg-amber-500/10 text-amber-600",
      summary: "Performance grading failed",
    };
  }

  return {
    badgeLabel: "Pending",
    badgeClassName:
      "border-base-300 text-base-content/45",
    summary: "Performance grading pending",
  };
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
            ? `Select a session to open its full performance grading review. End times are shown in your local time zone${timeZone ? ` (${timeZone})` : ""}.`
            : "Sign in to view your saved session history."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!signedIn ? (
          <p className="text-sm text-base-content/60">
            Your previous practice sessions will appear here after you sign in and complete one.
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-base-content/60">
            No completed sessions yet. Finish a practice session and its grading will show up here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-none border border-border bg-base-100">
            <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">
              Sessions
            </div>
            <div className="max-h-[34rem] overflow-y-auto">
              {sessions.map((session) => {
                const status = getSessionStatus(session);

                return (
                  <Link
                    key={session.id}
                    href={session.reviewHref}
                    className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 transition last:border-b-0 hover:bg-base-200/50"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.16em] text-base-content/55">
                        <span>{session.categoryLabel}</span>
                        {session.difficultyLabel ? <span>{session.difficultyLabel}</span> : null}
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-base-content">
                        {session.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/60">
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
                      <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-base-content/55">
                        <span>{status.summary}</span>
                        <span className="text-base-content/30">•</span>
                        <span className="inline-flex items-center gap-1 text-base-content/70">
                          Open review
                          <ArrowUpRight className="size-3.5" />
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span
                          className={cn(
                            "inline-flex rounded-none border px-2 py-1 text-xs font-semibold",
                            status.badgeClassName,
                          )}
                        >
                          {status.badgeLabel}
                        </span>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-base-content/45">
                          {session.letterGrade
                            ? `${session.letterGrade} grade`
                            : session.overallScore !== null
                              ? "score"
                              : "status"}
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-base-content/35" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
