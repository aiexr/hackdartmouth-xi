import { Suspense } from "react";
import Link from "next/link";
import { Briefcase, Edit3, User } from "lucide-react";
import { getOptionalServerSession } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";
import { UserModel } from "@/lib/models";
import { ProfileEditor } from "@/components/app/profile-editor";
import { ResumeUploaderCard } from "@/components/app/resume-uploader-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

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
      </div>
  );
}
