import Link from "next/link";
import { Award, Brain, Briefcase, Download, Edit3, Flame, FileText, Target, TrendingUp, User, type LucideIcon } from "lucide-react";

const achievementIcons: Record<string, LucideIcon> = {
  flame: Flame,
  target: Target,
  "trending-up": TrendingUp,
  brain: Brain,
};
import { getOptionalServerSession } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";
import { UserModel } from "@/lib/models";
import { MainShell } from "@/components/app/main-shell";
import { ProfileEditor } from "@/components/app/profile-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getOptionalServerSession();
  const metrics = await getUserInterviewMetrics(session?.user?.email);
  const dbUser = session?.user?.email ? await UserModel.getUserByEmail(session.user.email) : null;
  
  const profileName = (dbUser?.name || session?.user?.name) ?? "Guest user";
  const profileBio = dbUser?.bio || null;
  const profileFocusTrack = dbUser?.focusTrack || null;
  const profileResumeName = dbUser?.resumeFileName || dbUser?.resumeUrl || null;
  const profileResumeDate = dbUser?.resumeUploadedAt
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(dbUser.resumeUploadedAt)
    : null;
  const hasStoredResume = Boolean(dbUser?.resumeFileName && dbUser?.resumeUploadedAt);
  
  const subtitle = !metrics.hasSession
    ? "Sign in to save interviews and unlock profile progress."
    : !metrics.databaseReady
      ? "MongoDB is not configured yet, so profile stats are waiting on persistence."
      : profileFocusTrack && metrics.completedSessions
        ? `${profileFocusTrack} focus · ${metrics.completedSessions} completed practice loops`
        : metrics.topTrackName && metrics.completedSessions
          ? `${metrics.topTrackName} focus · ${metrics.completedSessions} completed practice loops`
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
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground leading-relaxed">{profileBio}</p>
            </CardContent>
          </Card>
        )}

        {profileResumeName && (
          <Card>
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <h2 className="text-lg font-semibold">Resume</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {profileResumeName}
                  {profileResumeDate ? ` · Uploaded ${profileResumeDate}` : " · Stored on your profile"}
                </p>
                {dbUser?.resumeUrl && !hasStoredResume && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Legacy link still available in your profile data.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge>{hasStoredResume ? "Saved" : "Legacy"}</Badge>
                {hasStoredResume ? (
                  <Button asChild variant="secondary">
                    <a href="/api/user/profile/resume" target="_blank" rel="noreferrer">
                      <Download className="size-4" />
                      Download
                    </a>
                  </Button>
                ) : dbUser?.resumeUrl ? (
                  <Button asChild variant="secondary">
                    <a href={dbUser.resumeUrl} target="_blank" rel="noreferrer">
                      <Download className="size-4" />
                      Open link
                    </a>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Profile Information</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Update your display name, bio, resume, and focus track from your profile page.
            </p>
          </div>

          <ProfileEditor />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {metrics.profileStats.map((item) => (
            <Card key={item.label}>
              <CardContent className="p-5 text-center">
                <div className={`text-3xl font-semibold ${item.accent}`}>{item.value}</div>
                <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <h2>Track mastery</h2>
            <div className="mt-5 space-y-5">
              {metrics.mastery.map((skill) => (
                <div key={skill.name}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-muted-foreground">
                      {skill.label} · {skill.sessions} session{skill.sessions === 1 ? "" : "s"}
                    </span>
                  </div>
                  <Progress value={skill.level} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
                      <div className="mx-auto flex size-12 items-center justify-center rounded-none bg-amber-50">
                        <Icon className="size-6 text-amber-500" />
                      </div>
                    );
                  })()}
                  <h3 className="mt-4 text-base">{achievement.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
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
