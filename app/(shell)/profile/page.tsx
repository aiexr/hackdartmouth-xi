import { Suspense } from "react";
import Link from "next/link";
import { Briefcase, Edit3, User } from "lucide-react";
import { scenarios } from "@/data/scenarios";
import { getOptionalServerSession } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";
import { InterviewModel, UserModel } from "@/lib/models";
import { ProfileHistory } from "@/components/app/profile-history";
import { ProfileEditor } from "@/components/app/profile-editor";
import { ResumeUploaderCard } from "@/components/app/resume-uploader-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

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

async function ProfileStats({ email }: { email?: string | null }) {
  const [metrics, dbUser] = await Promise.all([
    getUserInterviewMetrics(email ?? undefined).catch(() => getUserInterviewMetrics()),
    email
      ? UserModel.getUserByEmail(email).catch(() => null)
      : Promise.resolve(null),
  ]);

  const profileBio = dbUser?.bio || null;
  const hasResumeContext = Boolean(dbUser?.resumeExtractedText?.trim());

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
            <p className="text-sm text-base-content/60 leading-relaxed">{profileBio}</p>
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

function ProfileStatsSkeleton() {
  return (
    <>
      <div className="h-4 w-48 rounded bg-base-300/50 animate-pulse" />
      <div className="h-24 rounded border border-border bg-base-200/30 animate-pulse" />
      <div className="h-20 rounded border border-border bg-base-200/30 animate-pulse" />
    </>
  );
}

async function ProfileHistorySection({ email }: { email?: string | null }) {
  if (!email) {
    return <ProfileHistory signedIn={false} sessions={[]} />;
  }

  const interviews = await InterviewModel.getInterviewsByUser(email).catch(() => []);

  const sessions = interviews
    .filter((interview) => {
      const status = String(interview.status ?? "").toLowerCase();
      return Boolean(interview.completedAt) || status === "completed" || status === "graded";
    })
    .sort((left, right) => {
      const leftTime = new Date(left.completedAt ?? left.createdAt).getTime();
      const rightTime = new Date(right.completedAt ?? right.createdAt).getTime();
      return leftTime - rightTime;
    })
    .map((interview) => {
      const scenarioId = interview.scenarioId ?? null;
      const scenarioMeta = getHistoryScenarioMeta(scenarioId);
      const transcriptCount = Array.isArray(interview.transcript) ? interview.transcript.length : 0;
      const overallScore =
        typeof interview.overallScore === "number" ? Math.max(0, Math.min(100, Math.round(interview.overallScore))) : null;
      const letterGrade = typeof interview.letterGrade === "string" ? interview.letterGrade : null;
      const interviewId =
        interview._id
          ? String(interview._id)
          : `${interview.createdAt?.toISOString?.() ?? "session"}-${scenarioId ?? "unknown"}`;

      return {
        id: interviewId,
        scenarioId,
        title: scenarioMeta.title,
        categoryLabel: scenarioMeta.categoryLabel,
        trackLabel: scenarioMeta.trackLabel,
        difficultyLabel: scenarioMeta.difficultyLabel,
        completedAt: interview.completedAt ? interview.completedAt.toISOString() : null,
        createdAt: interview.createdAt ? interview.createdAt.toISOString() : null,
        overallScore,
        letterGrade,
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

  const descendingSessions = sessionsWithDelta
    .slice()
    .sort((left, right) => {
      const leftTime = new Date(left.completedAt ?? left.createdAt).getTime();
      const rightTime = new Date(right.completedAt ?? right.createdAt).getTime();
      return rightTime - leftTime;
    });

  return <ProfileHistory signedIn sessions={descendingSessions} />;
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

export default async function ProfilePage() {
  const session = await getOptionalServerSession().catch(() => null);

  const profileName = session?.user?.name ?? "Guest user";
  const profileActionHref = session?.user ? "#profile-editor" : "/auth/sign-in";
  const profileActionLabel = session?.user ? "Edit profile" : "Sign in";

  return (
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
            {session?.user?.image ? (
              <img
                src={session.user.image}
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
              <Link href={profileActionHref}>
                <Edit3 className="size-4" />
                {profileActionLabel}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Suspense fallback={<ProfileStatsSkeleton />}>
          <ProfileStats email={session?.user?.email} />
        </Suspense>

        <div id="profile-editor" className="space-y-4 scroll-mt-8">
          <ProfileEditor />
        </div>

        <Suspense fallback={<ProfileHistorySkeleton />}>
          <ProfileHistorySection email={session?.user?.email} />
        </Suspense>
      </div>
  );
}
