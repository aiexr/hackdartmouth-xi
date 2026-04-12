import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Play,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { getOptionalServerSession } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";
import { MainShell } from "@/components/app/main-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import logo from './logo.png'; 

export const dynamic = "force-dynamic";
export const maxDuration = 25;

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


export default async function DashboardPage() {
  const session = await withTimeout(
    getOptionalServerSession(),
    4500,
    "Session lookup timed out.",
  ).catch(() => null);
  const metrics = await withTimeout(
    getUserInterviewMetrics(session?.user?.email),
    5000,
    "Metrics lookup timed out.",
  ).catch(() => getUserInterviewMetrics());
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
                <h1 className="max-w-2xl text-2xl md:text-3xl font-bold tracking-tight">
                  Practice interviewing the LeetSpeak way with canonical round types and repeatable loops.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-base-content/70 md:text-lg">
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
            <div className="rounded-none border border-border bg-card p-5">
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
                    <span className="text-xs font-medium text-base-content/70">
                      loops
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm leading-6 text-base-content/70">
                    {weeklyCopy}
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-none bg-accent px-3 py-1 text-sm font-semibold text-accent-content">
                    <Zap className="size-4" />
                    {streakLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-none border border-base-300 bg-base-100 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-secondary-content">
                <TrendingUp className="size-4" />
                Current goals
              </div>
              <div className="mt-4 space-y-4">
                {metrics.goals.map((goal) => (
                  <div key={goal.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span>{goal.label}</span>
                      <span className="text-base-content/70">
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
                      className={`flex size-12 items-center justify-center rounded-none bg-gradient-to-br ${track.gradient} text-white shadow-lg`}
                    >
                      <Trophy className="size-5" />
                    </div>
                    <h3 className="mt-4 text-lg">{track.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-base-content/70">
                      {track.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-base-content/70">
                        {track.completed} of {track.total} completed
                      </span>
                      <span className="font-semibold text-base-content">
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
            <div className="space-y-4">
              {metrics.improvements.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <Badge className="bg-accent text-accent-foreground">
                        {item.tag}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground/90">
                        {item.source}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
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
