import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Flame,
  Play,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { getOptionalServerSession } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";
import { ActivityCalendar } from "@/components/app/activity-calendar";
import { MainShell } from "@/components/app/main-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getOptionalServerSession();
  const metrics = await getUserInterviewMetrics(session?.user?.email);
  const loopProgress = Math.min(
    100,
    (metrics.weeklyCompleted / metrics.weeklyTarget) * 100,
  );
  const loopCount = `${metrics.weeklyCompleted}/${metrics.weeklyTarget}`;
  const weeklyCopy = !metrics.hasSession
    ? "Sign in to sync interview history and see weekly progress from MongoDB."
    : !metrics.databaseReady
      ? "MongoDB is not configured yet, so progress data is waiting on the backend."
      : metrics.weeklyCompleted
        ? metrics.remainingLoops
          ? `${metrics.remainingLoops} more interview ${
              metrics.remainingLoops === 1 ? "loop keeps" : "loops keep"
            } this week on track.`
          : "This week's practice goal is already complete."
        : "Complete your first interview loop this week to start the tracker.";
  const streakLabel = metrics.streakDays
    ? `${metrics.streakDays}-day streak active`
    : "No active streak";

  return (
    <MainShell>
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden">
            <CardContent className="p-7 md:p-8">
              <div className="mt-5">
                <h1 className="max-w-2xl">
                  Practice interviewing the LeetSpeak way with focused role tracks and repeatable loops.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                  Choose a role track, jump into a repeatable interview scenario, and review visible progress over time. Weekly goals, streaks, and track completion now pull from saved interview history in MongoDB.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href="/practice">
                      <Play className="size-4" />
                      Start quick practice
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/auth/sign-in">
                      Open auth shell
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Target className="size-4" />
                Weekly progress
              </div>
              <div className="mt-5 flex items-center gap-4">
                <div className="relative flex size-28 items-center justify-center">
                  <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#f0effc"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(loopProgress / 100) * 327} 327`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-semibold">{loopCount}</span>
                    <span className="text-xs font-medium text-muted-foreground/90">
                      loops
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {weeklyCopy}
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                    <Zap className="size-4" />
                    {streakLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground">
                <TrendingUp className="size-4" />
                Current goals
              </div>
              <div className="mt-4 space-y-4">
                {metrics.goals.map((goal) => (
                  <div key={goal.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span>{goal.label}</span>
                      <span className="text-muted-foreground">
                        {goal.current}/{goal.total}
                      </span>
                    </div>
                    <Progress value={(goal.current / goal.total) * 100} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
          <div className="min-w-0">
            <ActivityCalendar
              activityDays={metrics.activityDays}
              totalSessions={metrics.completedSessions}
            />
          </div>
          <div className="flex flex-col justify-around rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-orange-50">
                <Flame className="size-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-semibold leading-tight">{metrics.streakDays}</div>
                <div className="text-xs text-muted-foreground">Current streak</div>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50">
                <Trophy className="size-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-semibold leading-tight">{metrics.longestStreak}</div>
                <div className="text-xs text-muted-foreground">Longest streak</div>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50">
                <Calendar className="size-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-semibold leading-tight">{metrics.activityDays.filter((d) => d.count > 0).length}</div>
                <div className="text-xs text-muted-foreground">Active days</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="size-5 text-primary" />
              <h2>Role tracks</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {metrics.tracks.map((track) => (
                <Card key={track.id}>
                  <CardContent className="p-5">
                    <div
                      className={`flex size-12 items-center justify-center rounded-2xl bg-linear-to-br ${track.gradient} text-white shadow-lg`}
                    >
                      <Trophy className="size-5" />
                    </div>
                    <h3 className="mt-4 text-lg">{track.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {track.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {track.completed} of {track.total} completed
                      </span>
                      <span className="font-semibold text-foreground">
                        {Math.round((track.completed / track.total) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(track.completed / track.total) * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="size-5 text-amber-500" />
              <h2>Learn from recent misses</h2>
            </div>
            <div className="space-y-3">
              {metrics.improvements.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-5">
                    <p className="text-sm leading-6 text-foreground">
                      {item.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.tag}</span>
                      <span>-</span>
                      <span>{item.source}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </MainShell>
  );
}
