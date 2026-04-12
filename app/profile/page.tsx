import Link from "next/link";
import { Award, Briefcase, Edit3, Flame, FileText, Target, TrendingUp, User, type LucideIcon } from "lucide-react";

const achievementIcons: Record<string, LucideIcon> = {
  flame: Flame,
  target: Target,
  "trending-up": TrendingUp,
};
import { getOptionalServerSession } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";
import { UserModel } from "@/lib/models";
import { MainShell } from "@/components/app/main-shell";
import { ProfileEditor } from "@/components/app/profile-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export default async function ProfilePage() {
  const session = await withTimeout(
    getOptionalServerSession(),
    1200,
    "Session lookup timed out.",
  ).catch(() => null);

  const [metrics, dbUser] = await Promise.all([
    withTimeout(
      getUserInterviewMetrics(session?.user?.email),
      1600,
      "Metrics lookup timed out.",
    ).catch(() => getUserInterviewMetrics()),
    session?.user?.email
      ? withTimeout(
          UserModel.getUserByEmail(session.user.email),
          1600,
          "User lookup timed out.",
        ).catch(() => null)
      : Promise.resolve(null),
  ]);
  
  const profileName = (dbUser?.name || session?.user?.name) ?? "Guest user";
  const profileBio = dbUser?.bio || null;
  const hasResumeContext = Boolean(dbUser?.resumeExtractedText?.trim());
  
  const subtitle = !metrics.hasSession
    ? "Sign in to save interviews and unlock profile progress."
    : !metrics.databaseReady
      ? "MongoDB is not configured yet, so profile stats are waiting on persistence."
      : metrics.completedSessions
        ? `${metrics.completedSessions} completed practice loops`
        : "No completed interview loops yet";
  
  const profileActionHref = session?.user ? "/settings" : "/auth/sign-in";
  const profileActionLabel = session?.user ? "Edit profile" : "Sign in";

  return (
    <MainShell>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={profileName}
                referrerPolicy="no-referrer"
                className="size-22 rounded-none object-cover ring-4 ring-primary/10"
              />
            ) : (
              <div className="flex size-22 items-center justify-center rounded-none bg-primary/10 text-primary">
                <User className="size-10" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1>{profileName}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-base-content/60">
                <Briefcase className="size-4" />
                {subtitle}
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href={profileActionHref}>
                <Edit3 className="size-4" />
                {profileActionLabel}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {profileBio && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-3">About</h2>
              <p className="text-sm text-base-content/60 leading-relaxed">{profileBio}</p>
            </CardContent>
          </Card>
        )}

        {hasResumeContext && (
          <Card>
            <CardContent className="p-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <h2 className="text-lg font-semibold">Resume</h2>
                </div>
                <p className="mt-2 text-sm text-base-content/60">
                  Resume processed successfully.
                </p>
                <p className="mt-1 text-xs text-base-content/60">
                  Extracted text context is stored in MongoDB for interview coaching and grading.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Profile Information</h2>
            <p className="mt-2 text-sm text-base-content/60">
              Update your display name, bio, and resume from your profile page.
            </p>
          </div>

          <ProfileEditor />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {metrics.profileStats.map((item) => (
            <Card key={item.label}>
              <CardContent className="p-5 text-center">
                <div className={`text-3xl font-semibold ${item.accent}`}>{item.value}</div>
                <p className="mt-2 text-sm text-base-content/60">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>


        <div>
          <div className="mb-4 flex items-center gap-2">
            <Award className="size-5 text-amber-500" />
            <h2>Achievements</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {metrics.achievements.map((achievement) => (
              <Card key={achievement.title}>
                <CardContent className="p-5 text-center">
                  {(() => {
                    const Icon = achievementIcons[achievement.icon] ?? Award;
                    return (
                      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-amber-50">
                        <Icon className="size-6 text-amber-500" />
                      </div>
                    );
                  })()}
                  <h3 className="mt-4 text-base">{achievement.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-base-content/60">
                    {achievement.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainShell>
  );
}
