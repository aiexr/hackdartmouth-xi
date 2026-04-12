"use client";

import type { CSSProperties, RefObject } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Calendar,
  Flame,
  Home,
  Play,
  Settings,
  Target,
  TrendingUp,
  Trophy,
  User,
} from "lucide-react";
import { ActivityCalendar } from "@/components/app/activity-calendar";
import { ThemeLogo } from "@/components/app/theme-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ActivityDay } from "@/lib/interview-metrics";
import { cn } from "@/lib/utils";

export const PREVIEW_NATURAL_WIDTH = 1460;
export const PREVIEW_NATURAL_HEIGHT = 920;
export const AUTH_PREVIEW_GEOMETRY_KEY = "leetspeak-auth-preview-geometry";

type DashboardPreviewProps = {
  className?: string;
  avatarUrl?: string | null;
};

const navigation = [
  { label: "Home", icon: Home, active: true },
  { label: "Practice", icon: Play, active: false },
  { label: "Profile", icon: User, active: false },
  { label: "LeetCoach", icon: WhistleIcon, active: false },
  { label: "LLM", icon: Bot, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export function DashboardPreview({ className, avatarUrl }: DashboardPreviewProps) {
  const activityDays = useMemo(() => buildPreviewActivityDays(), []);

  return (
    <div
      className={cn(
        "flex h-full w-full overflow-hidden bg-transparent text-base-content select-none pointer-events-none",
        className,
      )}
    >
      <aside className="hidden w-64 shrink-0 border-r border-border bg-base-100 px-4 py-7 md:flex md:flex-col">
        <div className="flex items-center gap-3 px-3">
          <ThemeLogo alt="LeetSpeak logo" className="h-10 w-auto" />
          <span className="pt-2 text-base font-semibold tracking-tight">LeetSpeak</span>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-0.5">
          {navigation.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                item.active
                  ? "bg-primary text-white"
                  : "text-base-content/60",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="flex items-center gap-3 md:hidden">
            <ThemeLogo alt="LeetSpeak logo" className="h-9 w-auto" />
            <span className="text-sm font-semibold tracking-tight">LeetSpeak</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-medium text-base-content/60">Sign out</span>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="size-9 rounded-full ring-2 ring-border"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-content ring-2 ring-primary/20">
                <User className="size-4" />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
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
                      <Button size="lg" className="cursor-default text-white">
                        <Play className="w-4 h-4" />
                        Start quick practice
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <PreviewMetrics />
            </section>
          </div>
        </main>
      </div>
    </div>
  );

  function PreviewMetrics() {
    return (
      <>
        <div className="grid gap-4">
          <div className="rounded-none border border-border bg-base-100 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Target className="size-4" />
              Today's progress
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="relative flex w-28 h-28 items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
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
                    strokeDasharray="0 327"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-semibold">0/3</span>
                  <span className="text-xs font-medium text-base-content/60">
                    loops
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-6 text-base-content/60">
                  Complete your first interview loop this week to start the tracker.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-none border border-border bg-base-100 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-base-content">
              <TrendingUp className="size-4" />
              Starter goals
            </div>
            <div className="mt-4 space-y-4">
              <PreviewGoal
                label="Complete 3 interviews this week"
                current={0}
                total={3}
              />
              <PreviewGoal
                label="Hit a 90+ score once"
                current={0}
                total={90}
              />
            </div>
          </div>
        </div>

        <section className="col-span-full grid items-stretch gap-4 md:grid-cols-[minmax(0,3fr)_minmax(196px,220px)]">
          <div className="min-w-0">
            <ActivityCalendar
              activityDays={activityDays}
            />
          </div>
          <div className="flex flex-col divide-y divide-base-300/70 border border-border bg-base-100">
            <PreviewStat icon={Flame} colorClass="bg-base-200/70 text-base-content/55" value={0} label="Current streak" />
            <PreviewStat icon={Trophy} colorClass="bg-base-200/70 text-base-content/55" value={0} label="Longest streak" />
            <PreviewStat icon={Calendar} colorClass="bg-base-200/70 text-base-content/55" value={0} label="Active days" />
          </div>
        </section>
      </>
    );
  }
}

export function ScaledDashboardPreview({
  className,
  avatarUrl,
  frameRef,
  outerStyle,
}: {
  className?: string;
  avatarUrl?: string | null;
  frameRef?: RefObject<HTMLDivElement | null>;
  outerStyle?: CSSProperties;
}) {
  const localFrameRef = useRef<HTMLDivElement | null>(null);
  const resolvedFrameRef = frameRef ?? localFrameRef;
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = resolvedFrameRef.current;
    if (!element) return;

    const updateScale = () => {
      setScale(element.clientWidth / PREVIEW_NATURAL_WIDTH);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [resolvedFrameRef]);

  return (
    <div
      ref={resolvedFrameRef}
      className={cn(
        "relative ml-auto w-full max-w-[70rem] overflow-hidden border border-border bg-base-100",
        className,
      )}
      style={{
        aspectRatio: `${PREVIEW_NATURAL_WIDTH} / ${PREVIEW_NATURAL_HEIGHT}`,
        ...outerStyle,
      }}
    >
      <div
        className={cn(
          "absolute left-0 top-0 origin-top-left transition-opacity duration-150",
          scale === null && "opacity-0",
        )}
        style={{
          width: PREVIEW_NATURAL_WIDTH,
          height: PREVIEW_NATURAL_HEIGHT,
          transform: `scale(${scale ?? 1})`,
        }}
      >
        <DashboardPreview className="h-full w-full" avatarUrl={avatarUrl} />
      </div>
    </div>
  );
}

function PreviewGoal({
  label,
  current,
  total,
}: {
  label: string;
  current: number;
  total: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="text-base-content/60">
          {current}/{total}
        </span>
      </div>
      <Progress value={(current / total) * 100} />
    </div>
  );
}

function PreviewStat({
  icon: Icon,
  colorClass,
  value,
  label,
}: {
  icon: typeof Flame;
  colorClass: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className={cn("flex size-10 items-center justify-center", colorClass)}>
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-semibold leading-none">{value}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-base-content/50">{label}</div>
      </div>
    </div>
  );
}

function buildPreviewActivityDays(): ActivityDay[] {
  const days: ActivityDay[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const cursor = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    days.push({ date: key, count: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function WhistleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 9h12a3 3 0 0 1 0 6H2z" />
      <path d="M17 10.5h5v3h-5" />
      <circle cx="8" cy="12" r="1.5" />
    </svg>
  );
}
