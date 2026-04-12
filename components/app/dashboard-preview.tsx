"use client";

import { Calendar, Flame, Home, Play, Settings, Target, TrendingUp, Trophy, User, Zap } from "lucide-react";
import { ThemeLogo } from "@/components/app/theme-logo";
import { cn } from "@/lib/utils";

export const AUTH_PREVIEW_STORAGE_KEY = "leetspeak-auth-preview";

type DashboardPreviewProps = {
  className?: string;
  avatarUrl?: string | null;
  fullscreen?: boolean;
};

const navItems = [
  { label: "Home", icon: Home, active: true },
  { label: "Practice", icon: Play },
  { label: "Profile", icon: User },
  { label: "Settings", icon: Settings },
];

const heatmapCells = Array.from({ length: 66 }, (_, index) => {
  const shades = [
    "bg-base-200/80",
    "bg-emerald-200/60",
    "bg-emerald-300/70",
    "bg-emerald-400/80",
    "bg-emerald-500/85",
  ];
  return shades[index % shades.length];
});

function ProgressRing() {
  return (
    <div className="relative flex size-14 items-center justify-center sm:size-20">
      <svg className="size-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r="52" fill="none" stroke="#f0effc" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="118 327"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold leading-none sm:text-2xl">1/3</span>
        <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.16em] text-base-content/50 sm:text-[10px]">
          loops
        </span>
      </div>
    </div>
  );
}

function MiniProgress({ label, current, total, value }: { label: string; current: string; total: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-[9px] text-base-content/70 sm:text-xs">
        <span className="truncate">{label}</span>
        <span className="shrink-0 text-base-content/50">
          {current}/{total}
        </span>
      </div>
      <div className="h-1.5 border border-border bg-base-200/50 sm:h-2">
        <div className="h-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: typeof Flame;
  tone: string;
  value: string;
  label: string;
}) {
  return (
    <div className="grid gap-2 border border-border bg-base-100 p-2 sm:p-3">
      <div className={cn("flex size-7 items-center justify-center border border-border sm:size-8", tone)}>
        <Icon className="size-4" />
      </div>
      <div className="text-lg font-semibold leading-none sm:text-2xl">{value}</div>
      <div className="text-[9px] uppercase tracking-[0.14em] text-base-content/50 sm:text-[10px]">{label}</div>
    </div>
  );
}

export function DashboardPreview({
  className,
  avatarUrl,
  fullscreen = false,
}: DashboardPreviewProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full overflow-hidden border border-border bg-background text-base-content select-none",
        className,
      )}
    >
      <aside className="flex w-[26%] shrink-0 flex-col border-r border-border bg-base-100 px-2 py-3 sm:px-4 sm:py-6">
        <div className="flex items-center gap-2 border border-transparent px-1 sm:gap-3 sm:px-2">
          <ThemeLogo alt="LeetSpeak preview logo" className="h-5 w-auto sm:h-8" />
          <span className="truncate pt-1 text-[10px] font-semibold tracking-tight sm:text-sm">
            LeetSpeak
          </span>
        </div>

        <nav className="mt-5 grid gap-1 sm:mt-8">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-2 border px-2 py-1.5 text-[9px] font-medium sm:gap-3 sm:px-3 sm:py-2.5 sm:text-sm",
                item.active
                  ? "border-primary bg-primary text-primary-content"
                  : "border-transparent text-base-content/55",
              )}
            >
              <item.icon className="size-3 shrink-0 sm:size-4" />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-border px-3 py-2 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[9px] font-medium text-base-content/55 sm:text-sm">
              Sign out
            </span>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="size-7 border border-border object-cover sm:size-9"
              />
            ) : (
              <div className="flex size-7 items-center justify-center border border-border bg-primary/10 text-primary sm:size-9">
                <User className="size-3.5 sm:size-4" />
              </div>
            )}
          </div>
        </header>

        <div
          className={cn(
            "grid flex-1 gap-3 p-3 sm:gap-6 sm:p-6",
            fullscreen ? "lg:grid-cols-[1.1fr_0.9fr]" : "grid-cols-[1.1fr_0.9fr]",
          )}
        >
          <div className="grid min-w-0 gap-3 sm:gap-6">
            <section className="border border-border bg-base-100 p-3 sm:p-6">
              <div className="max-w-[28rem]">
                <h2 className="text-sm leading-tight sm:text-2xl">
                  Start practicing your interviewing skills.
                </h2>
                <p className="mt-2 max-w-md text-[10px] leading-5 text-base-content/60 sm:mt-4 sm:text-sm">
                  Practice behavioral, technical, and system design interviews with instant feedback.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 border border-primary bg-primary px-3 py-2 text-[10px] font-medium text-primary-content sm:mt-6 sm:px-4 sm:py-3 sm:text-sm">
                  <Play className="size-3 sm:size-4" />
                  Start quick practice
                </div>
              </div>
            </section>

            <section className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
              <div className="border border-border bg-base-100 p-3 sm:p-5">
                <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-base-content/50 sm:text-xs">
                  Interview activity
                </div>
                <div className="grid grid-cols-11 gap-1 sm:grid-cols-11 sm:gap-1.5">
                  {heatmapCells.map((shade, index) => (
                    <div
                      key={index}
                      className={cn("aspect-square border border-border/50", shade)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <StatTile icon={Flame} tone="bg-orange-50 text-orange-500" value="5" label="Current streak" />
                <StatTile icon={Trophy} tone="bg-amber-50 text-amber-500" value="9" label="Longest streak" />
                <StatTile icon={Calendar} tone="bg-emerald-50 text-emerald-500" value="18" label="Active days" />
              </div>
            </section>
          </div>

          <div className="grid min-w-0 gap-3 sm:gap-6">
            <section className="border border-border bg-base-100 p-3 sm:p-5">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary sm:text-xs">
                <Target className="size-3.5 sm:size-4" />
                Today's progress
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center sm:gap-4">
                <ProgressRing />
                <div className="grid gap-2">
                  <p className="text-[10px] leading-5 text-base-content/60 sm:text-sm">
                    One more interview loop keeps this week on track.
                  </p>
                  <div className="inline-flex w-fit items-center gap-1.5 border border-border bg-accent px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-accent-foreground sm:px-3 sm:text-[10px]">
                    <Zap className="size-3 sm:size-3.5" />
                    5-day streak active
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-border bg-base-100 p-3 sm:p-5">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-base-content sm:text-xs">
                <TrendingUp className="size-3.5 sm:size-4" />
                Starter goals
              </div>
              <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4">
                <MiniProgress label="Complete 3 practice loops this week" current="2" total="3" value={66} />
                <MiniProgress label="Hit a 90+ score once" current="74" total="90" value={82} />
                <MiniProgress label="Review one weak answer" current="1" total="1" value={100} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
