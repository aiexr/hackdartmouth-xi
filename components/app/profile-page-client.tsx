"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Briefcase, Edit3, User } from "lucide-react";
import { scenarios } from "@/data/scenarios";
import { ProfileHistory } from "@/components/app/profile-history";
import { ProfileEditor } from "@/components/app/profile-editor";
import { ResumeUploaderCard } from "@/components/app/resume-uploader-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UserProfile = {
  email: string;
  name: string;
  image: string;
  bio: string | null;
  hasResumeContext?: boolean;
};

type UserInterviewMetrics = {
  hasSession: boolean;
  totalSessions: number;
  completedSessions: number;
  averageScore: number | null;
  bestScore: number | null;
  weeklyCompleted: number;
  weeklyTarget: number;
  streakDays: number;
  longestStreak: number;
};

type InterviewRecord = {
  _id?: string;
  scenarioId?: string | null;
  status?: string | null;
  transcript?: unknown[];
  overallScore?: number | null;
  letterGrade?: string | null;
  gradingError?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
};

let profileCache: UserProfile | null = null;
let profileMetricsCache: UserInterviewMetrics | null = null;
let profileInterviewsCache: InterviewRecord[] | null = null;

const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));

function formatScenarioTitleFromId(scenarioId: string) {
  const normalized = scenarioId
    .replace(/^lc-/, "")
    .replace(/^quant-/, "")
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

  return normalized || "Practice session";
}

function getHistoryScenarioMeta(scenarioId: string | null) {
  if (!scenarioId) {
    return {
      title: "Practice session",
      categoryLabel: "Interview",
      trackLabel: null,
      difficultyLabel: null,
    };
  }

  const scenario = scenarioById.get(scenarioId);
  if (scenario) {
    return {
      title: scenario.title,
      categoryLabel: scenario.category.replace(/-/g, " "),
      trackLabel: scenario.trackLabel,
      difficultyLabel: scenario.difficulty,
    };
  }

  return {
    title: formatScenarioTitleFromId(scenarioId),
    categoryLabel: scenarioId.startsWith("lc-")
      ? "LeetCode"
      : scenarioId.startsWith("quant-")
        ? "Quant"
        : "Interview",
    trackLabel: null,
    difficultyLabel: null,
  };
}

function ProfileStatsSkeleton() {
  return (
    <>
      <div className="h-4 w-48 animate-pulse rounded bg-base-300/50" />
      <div className="h-24 animate-pulse rounded border border-border bg-base-200/30" />
      <div className="h-20 animate-pulse rounded border border-border bg-base-200/30" />
    </>
  );
}

function ProfileHistorySkeleton() {
  return (
    <div className="rounded-none border border-border bg-base-100 p-6">
      <div className="h-6 w-28 animate-pulse rounded-none bg-base-300/55" />
      <div className="mt-2 h-4 w-80 animate-pulse rounded-none bg-base-300/40" />
      <div className="mt-6 space-y-4">
        <div className="h-56 animate-pulse rounded-none border border-border bg-base-200/40" />
        <div className="h-56 animate-pulse rounded-none border border-border bg-base-200/40" />
      </div>
    </div>
  );
}

export function ProfilePageClient() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(profileCache);
  const [metrics, setMetrics] = useState<UserInterviewMetrics | null>(profileMetricsCache);
  const [interviews, setInterviews] = useState<InterviewRecord[]>(profileInterviewsCache ?? []);
  const [loading, setLoading] = useState(
    () => !(profileCache && profileMetricsCache && profileInterviewsCache),
  );

  useEffect(() => {
    const controller = new AbortController();

    setLoading(!(profileCache && profileMetricsCache && profileInterviewsCache));
    Promise.all([
      fetch("/api/user/profile", { signal: controller.signal }).then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        return (await response.json()) as UserProfile;
      }),
      fetch("/api/user/metrics", { signal: controller.signal }).then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch metrics");
        }
        return (await response.json()) as UserInterviewMetrics;
      }),
      fetch("/api/interviews", { signal: controller.signal }).then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch interviews");
        }
        return (await response.json()) as InterviewRecord[];
      }),
    ])
      .then(([nextProfile, nextMetrics, nextInterviews]) => {
        profileCache = nextProfile;
        profileMetricsCache = nextMetrics;
        profileInterviewsCache = nextInterviews;
        setProfile(nextProfile);
        setMetrics(nextMetrics);
        setInterviews(nextInterviews);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to load profile page data:", error);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  const profileName = session?.user?.name ?? profile?.name ?? "Guest user";
  const profileImage = session?.user?.image ?? profile?.image ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          {profileImage ? (
            <img
              src={profileImage}
              alt={profileName}
              referrerPolicy="no-referrer"
              className="size-22 rounded-full object-cover ring-4 ring-primary/10"
            />
          ) : (
            <div className="flex size-22 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-10" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1>{profileName}</h1>
          </div>
          <Button asChild variant="secondary">
            <Link href="#profile-editor">
              <Edit3 className="size-4" />
              Edit profile
            </Link>
          </Button>
        </CardContent>
      </Card>

      {loading || !metrics ? (
        <ProfileStatsSkeleton />
      ) : (
        <ProfileStats profile={profile} metrics={metrics} />
      )}

      <div id="profile-editor" className="space-y-4 scroll-mt-8">
        <ProfileEditor />
      </div>

      {loading ? (
        <ProfileHistorySkeleton />
      ) : (
        <ProfileHistory signedIn sessions={buildSessions(interviews)} />
      )}
    </div>
  );
}

function ProfileStats({
  profile,
  metrics,
}: {
  profile: UserProfile | null;
  metrics: UserInterviewMetrics;
}) {
  const profileBio = profile?.bio || null;
  const hasResumeContext = Boolean(profile?.hasResumeContext);

  const subtitle = !metrics.hasSession
    ? "Sign in to track your interview progress."
    : metrics.completedSessions > 0
      ? `${metrics.completedSessions} completed session${metrics.completedSessions !== 1 ? "s" : ""}`
      : null;

  const stats = [
    { label: "Sessions", value: metrics.totalSessions > 0 ? `${metrics.totalSessions}` : "—", accent: "text-primary" },
    { label: "Avg Score", value: metrics.averageScore !== null ? `${metrics.averageScore}` : "—", accent: "text-emerald-500" },
    { label: "Best Score", value: metrics.bestScore !== null ? `${metrics.bestScore}` : "—", accent: "text-amber-500" },
    { label: "Day Streak", value: metrics.streakDays > 0 ? `${metrics.streakDays}` : "—", accent: "text-orange-500" },
    { label: "Best Streak", value: metrics.longestStreak > 0 ? `${metrics.longestStreak}` : "—", accent: "" },
    { label: "This Week", value: `${metrics.weeklyCompleted}/${metrics.weeklyTarget}`, accent: "text-indigo-500" },
  ];

  return (
    <>
      {subtitle && (
        <p className="flex items-center gap-2 text-sm text-base-content/60">
          <Briefcase className="size-4" />
          {subtitle}
        </p>
      )}

      {profileBio && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3">About</h2>
            <p className="text-sm leading-relaxed text-base-content/60">{profileBio}</p>
          </CardContent>
        </Card>
      )}

      <ResumeUploaderCard initialHasResumeContext={hasResumeContext} />

      <div className="rounded-none border border-border bg-base-100">
        <div className="grid grid-cols-3 divide-x divide-y divide-border sm:grid-cols-6 sm:divide-y-0">
          {stats.map(({ label, value, accent }) => (
            <div key={label} className="px-4 py-5 text-center">
              <div className={`text-2xl font-semibold ${accent}`}>{value}</div>
              <div className="mt-1 text-xs text-base-content/60">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function buildSessions(interviews: InterviewRecord[]) {
  const sessions = interviews
    .filter((interview) => {
      const status = String(interview.status ?? "").toLowerCase();
      return Boolean(interview.completedAt) || status === "completed" || status === "graded";
    })
    .sort((left, right) => {
      const leftTime = new Date(left.completedAt ?? left.createdAt ?? "").getTime();
      const rightTime = new Date(right.completedAt ?? right.createdAt ?? "").getTime();
      return leftTime - rightTime;
    })
    .map((interview) => {
      const scenarioId = interview.scenarioId ?? null;
      const scenarioMeta = getHistoryScenarioMeta(scenarioId);
      const transcriptCount = Array.isArray(interview.transcript) ? interview.transcript.length : 0;
      const overallScore =
        typeof interview.overallScore === "number"
          ? Math.max(0, Math.min(100, Math.round(interview.overallScore)))
          : null;
      const letterGrade = typeof interview.letterGrade === "string" ? interview.letterGrade : null;
      const gradingError = typeof interview.gradingError === "string" ? interview.gradingError : null;
      const interviewId =
        typeof interview._id === "string"
          ? interview._id
          : `${interview.createdAt ?? "session"}-${scenarioId ?? "unknown"}`;

      return {
        id: interviewId,
        scenarioId,
        title: scenarioMeta.title,
        categoryLabel: scenarioMeta.categoryLabel,
        trackLabel: scenarioMeta.trackLabel,
        difficultyLabel: scenarioMeta.difficultyLabel,
        completedAt: interview.completedAt ?? null,
        createdAt: interview.createdAt ?? null,
        overallScore,
        letterGrade,
        gradingError,
        transcriptCount,
        reviewHref: `/review/${scenarioId ?? "interview"}?interviewId=${interviewId}`,
      };
    });

  const previousScoreByScenario = new Map<string, number>();
  const sessionsWithDelta = sessions.map((session) => {
    const previousScore =
      session.scenarioId && typeof session.overallScore === "number"
        ? previousScoreByScenario.get(session.scenarioId) ?? null
        : null;
    const scoreDelta =
      typeof session.overallScore === "number" && previousScore !== null
        ? session.overallScore - previousScore
        : null;

    if (session.scenarioId && typeof session.overallScore === "number") {
      previousScoreByScenario.set(session.scenarioId, session.overallScore);
    }

    return {
      ...session,
      scoreDelta,
    };
  });

  return sessionsWithDelta
    .slice()
    .sort((left, right) => {
      const leftTime = new Date(left.completedAt ?? left.createdAt ?? "").getTime();
      const rightTime = new Date(right.completedAt ?? right.createdAt ?? "").getTime();
      return rightTime - leftTime;
    });
}
