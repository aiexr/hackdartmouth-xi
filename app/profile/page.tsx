import Link from "next/link";
import { getServerSession } from "next-auth";
import { Award, Briefcase, Edit3, User } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";
import { MainShell } from "@/components/app/main-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const metrics = await getUserInterviewMetrics(session?.user?.email);
  const profileName = session?.user?.name ?? "Guest user";
  const subtitle = !metrics.hasSession
    ? "Sign in to save interviews and unlock profile progress."
    : !metrics.databaseReady
      ? "MongoDB is not configured yet, so profile stats are waiting on persistence."
      : metrics.topTrackName
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
                className="size-[5.5rem] rounded-full object-cover ring-4 ring-primary/10"
              />
            ) : (
              <div className="flex size-[5.5rem] items-center justify-center rounded-full bg-primary/10 text-primary">
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
                  <div className="text-4xl">{achievement.icon}</div>
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
