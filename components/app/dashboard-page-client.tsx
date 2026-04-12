"use client";

import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Flame,
  Play,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { ActivityCalendar } from "@/components/app/activity-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ActivityDay = {
  date: string;
  count: number;
};

type GoalMetric = {
  label: string;
  current: number;
  total: number;
};

type ImprovementMetric = {
  id: string;
  title: string;
  tag: string;
  source: string;
  description: string;
};

type UserInterviewMetrics = {
  hasSession: boolean;
  databaseReady: boolean;
  completedSessions: number;
  weeklyCompleted: number;
  weeklyTarget: number;
  remainingLoops: number;
  streakDays: number;
  longestStreak: number;
  activityDays: ActivityDay[];
  goals: GoalMetric[];
  improvements: ImprovementMetric[];
};

function getRollingActiveDays(activityDays: ActivityDay[]) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setDate(start.getDate() - 364);

  const startKey = [
    start.getFullYear(),
    `${start.getMonth() + 1}`.padStart(2, "0"),
    `${start.getDate()}`.padStart(2, "0"),
  ].join("-");

  return activityDays.filter((day) => day.date >= startKey && day.count > 0).length;
}

export function DashboardPageClient({
  initialMetrics,
}: {
  initialMetrics: UserInterviewMetrics;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-10 md:py-10">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-7 md:p-8">
            <div className="mt-5">
              <h1 className="max-w-2xl">Start practicing your interviewing skills.</h1>
              <p className="mt-4 max-w-2xl text-base text-base-content/60 md:text-lg">
                Practice behavioral, technical, and system design interviews with instant feedback.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="text-white">
                  <Link href="/practice">
                    <Play className="w-4 h-4" />
                    Start quick practice
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <DashboardMetrics metrics={initialMetrics} />
      </section>
    </div>
  );
}

function DashboardMetrics({ metrics }: { metrics: UserInterviewMetrics }) {
  const safeWeeklyTarget = Math.max(1, metrics.weeklyTarget);
  const isOverGoal = metrics.weeklyCompleted > metrics.weeklyTarget;
  const rawLoopProgress = (metrics.weeklyCompleted / safeWeeklyTarget) * 100;
  const loopProgress = Math.min(100, rawLoopProgress);
  const overflowProgress =
    rawLoopProgress > 100 ? ((rawLoopProgress - 100) % 100 + 100) % 100 : 0;
  const loopCount = `${metrics.weeklyCompleted}/${metrics.weeklyTarget}`;
  const weeklyCopy = !metrics.hasSession
    ? "Sign in to track your practice history and progress."
    : !metrics.databaseReady
      ? "Progress data is unavailable right now."
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
    <>
      <div className="grid gap-4">
        <div className="rounded-none border border-border bg-base-100 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Target className="size-4" />
            Today's progress
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                {isOverGoal ? (
                  <>
                    <defs>
                      <linearGradient id="overlap-ring-base" x1="8" y1="8" x2="112" y2="112">
                        <stop offset="0%" stopColor="#ff5b9f" />
                        <stop offset="100%" stopColor="#ff0066" />
                      </linearGradient>
                      <linearGradient id="overlap-ring-top" x1="8" y1="8" x2="112" y2="112">
                        <stop offset="0%" stopColor="#c2185b" />
                        <stop offset="100%" stopColor="#7a0030" />
                      </linearGradient>
                    </defs>

                    <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="url(#overlap-ring-base)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="327 327"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="url(#overlap-ring-top)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(overflowProgress / 100) * 327} 327`}
                      strokeDashoffset="-4"
                    />
                  </>
                ) : (
                  <>
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#f0effc" strokeWidth="10" />
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
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold">{loopCount}</span>
                <span className="text-xs font-medium text-base-content/60">loops</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm leading-6 text-base-content/60">{weeklyCopy}</p>
              {metrics.streakDays > 0 && (
                <div className="inline-flex items-center gap-2 rounded-none bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                  <Zap className="size-4" />
                  {streakLabel}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-none border border-border bg-base-100 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-base-content">
            <TrendingUp className="size-4" />
            Starter goals
          </div>
          <div className="mt-4 space-y-4">
            {metrics.goals.map((goal) => (
              <div key={goal.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span>{goal.label}</span>
                  <span className="text-base-content/60">
                    {goal.current}/{goal.total}
                  </span>
                </div>
                <Progress value={(goal.current / goal.total) * 100} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="col-span-full grid items-stretch gap-4 md:grid-cols-[minmax(0,3fr)_minmax(196px,220px)]">
        <div className="min-w-0">
          <ActivityCalendar
            activityDays={metrics.activityDays}
          />
        </div>
        <div className="flex flex-col divide-y divide-base-300/70 border border-border bg-base-100">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex size-10 items-center justify-center bg-base-200/70 text-base-content/55">
              <Flame className="size-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-semibold leading-none">{metrics.streakDays}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-base-content/50">Current streak</div>
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex size-10 items-center justify-center bg-base-200/70 text-base-content/55">
              <Trophy className="size-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-semibold leading-none">{metrics.longestStreak}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-base-content/50">Longest streak</div>
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex size-10 items-center justify-center bg-base-200/70 text-base-content/55">
              <Calendar className="size-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-semibold leading-none">
                {getRollingActiveDays(metrics.activityDays)}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-base-content/50">Active days</div>
            </div>
          </div>
        </div>
      </section>

      {metrics.improvements.length > 0 && (
        <section className="col-span-full">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="size-5 text-amber-500" />
              <h2>Learn from recent misses</h2>
            </div>
            <div className="space-y-3">
              {metrics.improvements.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-5">
                    <p className="text-sm leading-6 text-base-content">{item.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-base-content/60">
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
      )}
    </>
  );
}
