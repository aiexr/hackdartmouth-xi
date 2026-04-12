"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Briefcase, Edit3, User } from "lucide-react";
import { ProfileHistory } from "@/components/app/profile-history";
import { ProfileEditor } from "@/components/app/profile-editor";
import { ResumeUploaderCard } from "@/components/app/resume-uploader-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ProfileStat = {
  label: string;
  value: string;
  accent: string;
};

type UserInterviewMetrics = {
  hasSession: boolean;
  totalSessions: number;
  completedSessions: number;
  averageScore: number | null;
  bestScore: number | null;
  weeklyCompleted: number;
  weeklyTarget: number;
  streakDays: number;
  longestStreak: number;
};

type HistorySession = {
  id: string;
  scenarioId: string | null;
  title: string;
  categoryLabel: string;
  trackLabel: string | null;
  difficultyLabel: string | null;
  completedAt: string | null;
  createdAt: string | null;
  overallScore: number | null;
  letterGrade: string | null;
  transcriptCount: number;
  reviewHref: string;
  scoreDelta: number | null;
};

type ProfileUserPayload = Record<string, unknown> & {
  name?: string;
  image?: string;
  bio?: string | null;
  hasResumeContext?: boolean;
};

type ProfileSummary = {
  user: ProfileUserPayload;
  metrics: UserInterviewMetrics;
  sessions: HistorySession[];
};

type CachedProfileEntry = {
  email: string;
  fetchedAt: number;
  value: ProfileSummary;
};

const PROFILE_CACHE_TTL_MS = 60_000;
const PROFILE_CACHE_KEY = "leetspeak-profile-summary";

let memoryProfileCache: CachedProfileEntry | null = null;

function getFallbackMetrics(): UserInterviewMetrics {
  return {
    hasSession: true,
    totalSessions: 0,
    completedSessions: 0,
    averageScore: null,
    bestScore: null,
    weeklyCompleted: 0,
    weeklyTarget: 4,
    streakDays: 0,
    longestStreak: 0,
  };
}

function getCachedSummary(email: string): CachedProfileEntry | null {
  if (memoryProfileCache?.email === email) {
    return memoryProfileCache;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedProfileEntry;
    if (
      parsed &&
      parsed.email === email &&
      typeof parsed.fetchedAt === "number" &&
      parsed.value
    ) {
      memoryProfileCache = parsed;
      return parsed;
    }
  } catch {
    // Ignore malformed cache payloads.
  }

  return null;
}

function setCachedSummary(email: string, value: ProfileSummary) {
  const entry: CachedProfileEntry = {
    email,
    fetchedAt: Date.now(),
    value,
  };

  memoryProfileCache = entry;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage write failures.
  }
}

function isFresh(entry: CachedProfileEntry | null) {
  return Boolean(entry && Date.now() - entry.fetchedAt < PROFILE_CACHE_TTL_MS);
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

function ProfileHistorySkeleton() {
  return (
    <div className="rounded-none border border-border bg-base-100 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="h-6 w-28 animate-pulse rounded-none bg-base-300/55" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded-none bg-base-300/40" />
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-24 animate-pulse rounded-none border border-border bg-base-200/40" />
          <div className="h-7 w-32 animate-pulse rounded-none border border-border bg-base-200/40" />
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-none border border-border bg-base-100">
        <div className="hidden h-10 border-b border-border bg-base-200/30 md:block" />
        <div className="space-y-0">
          <div className="border-b border-border/50 px-4 py-4">
            <div className="h-3 w-40 animate-pulse rounded-none bg-base-300/35" />
            <div className="mt-3 h-5 w-64 animate-pulse rounded-none bg-base-300/50" />
            <div className="mt-3 h-3 w-52 animate-pulse rounded-none bg-base-300/35 md:hidden" />
          </div>
          <div className="border-b border-border/50 px-4 py-4">
            <div className="h-3 w-32 animate-pulse rounded-none bg-base-300/35" />
            <div className="mt-3 h-5 w-56 animate-pulse rounded-none bg-base-300/50" />
            <div className="mt-3 h-3 w-48 animate-pulse rounded-none bg-base-300/35 md:hidden" />
          </div>
          <div className="px-4 py-4">
            <div className="h-3 w-36 animate-pulse rounded-none bg-base-300/35" />
            <div className="mt-3 h-5 w-60 animate-pulse rounded-none bg-base-300/50" />
            <div className="mt-3 h-3 w-44 animate-pulse rounded-none bg-base-300/35 md:hidden" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileGuestCard() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2>Sign in to edit your profile</h2>
          <p className="text-sm text-base-content/60">
            Your bio, weekly goal, resume context, and saved history appear here once you sign in.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ProfileStats({
  metrics,
  user,
  signedIn,
}: {
  metrics: UserInterviewMetrics;
  user: ProfileUserPayload | null;
  signedIn: boolean;
}) {
  const subtitle = !metrics.hasSession
    ? "Sign in to track your interview progress."
    : metrics.completedSessions > 0
      ? `${metrics.completedSessions} completed session${metrics.completedSessions !== 1 ? "s" : ""}`
      : null;

  const profileBio = typeof user?.bio === "string" ? user.bio : null;
  const hasResumeContext = Boolean(user?.hasResumeContext);

  const stats: ProfileStat[] = [
    {
      label: "Sessions",
      value: metrics.totalSessions > 0 ? `${metrics.totalSessions}` : "—",
      accent: "text-primary",
    },
    {
      label: "Avg Score",
      value: metrics.averageScore !== null ? `${metrics.averageScore}` : "—",
      accent: "text-emerald-500",
    },
    {
      label: "Best Score",
      value: metrics.bestScore !== null ? `${metrics.bestScore}` : "—",
      accent: "text-amber-500",
    },
    {
      label: "Day Streak",
      value: metrics.streakDays > 0 ? `${metrics.streakDays}` : "—",
      accent: "text-orange-500",
    },
    {
      label: "Best Streak",
      value: metrics.longestStreak > 0 ? `${metrics.longestStreak}` : "—",
      accent: "",
    },
    {
      label: "This Week",
      value: `${metrics.weeklyCompleted}/${metrics.weeklyTarget}`,
      accent: "text-indigo-500",
    },
  ];

  return (
    <>
      {subtitle ? (
        <p className="flex items-center gap-2 text-sm text-base-content/60">
          <Briefcase className="size-4" />
          {subtitle}
        </p>
      ) : null}

      {profileBio ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3">About</h2>
            <p className="text-sm leading-relaxed text-base-content/60">{profileBio}</p>
          </CardContent>
        </Card>
      ) : null}

      {signedIn ? <ResumeUploaderCard initialHasResumeContext={hasResumeContext} /> : null}

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

export function ProfilePage() {
  const { data: session, status } = useSession();
  const email = session?.user?.email ?? null;
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !email) {
      setSummary(null);
      setIsLoading(false);
      return;
    }

    const cached = getCachedSummary(email);
    if (cached) {
      setSummary(cached.value);
    } else {
      setSummary(null);
    }

    if (isFresh(cached)) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void fetch("/api/profile/summary", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load profile summary: ${response.status}`);
        }

        return (await response.json()) as ProfileSummary;
      })
      .then((nextSummary) => {
        if (cancelled) {
          return;
        }

        setCachedSummary(email, nextSummary);
        startTransition(() => {
          setSummary(nextSummary);
          setIsLoading(false);
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setIsLoading(false);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [email, status]);

  const signedIn = status === "authenticated" && Boolean(email);
  const metrics = summary?.metrics ?? getFallbackMetrics();
  const sessions = summary?.sessions ?? [];
  const profileUser = summary?.user ?? null;
  const profileName =
    (typeof profileUser?.name === "string" && profileUser.name) ||
    session?.user?.name ||
    "Guest user";
  const profileImage =
    (typeof profileUser?.image === "string" && profileUser.image) ||
    session?.user?.image ||
    null;

  const handleProfileUpdated = (nextUser: ProfileUserPayload) => {
    if (!email) {
      return;
    }

    setSummary((current) => {
      const nextSummary: ProfileSummary = {
        user: nextUser,
        metrics: {
          ...(current?.metrics ?? getFallbackMetrics()),
          weeklyTarget:
            typeof nextUser.preferences === "object" &&
            nextUser.preferences &&
            typeof (nextUser.preferences as Record<string, unknown>).weeklyGoal === "number"
              ? ((nextUser.preferences as Record<string, unknown>).weeklyGoal as number)
              : (current?.metrics.weeklyTarget ?? getFallbackMetrics().weeklyTarget),
        },
        sessions: current?.sessions ?? [],
      };

      setCachedSummary(email, nextSummary);
      return nextSummary;
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          {profileImage ? (
            <img
              src={profileImage}
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
            <h1>{status === "loading" ? "Loading profile..." : profileName}</h1>
          </div>
          <Button asChild variant="secondary">
            <Link href={signedIn ? "#profile-editor" : "/"}>
              <Edit3 className="size-4" />
              {signedIn ? "Edit profile" : "Sign in"}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {signedIn ? (
        isLoading && !summary ? (
          <ProfileStatsSkeleton />
        ) : (
          <ProfileStats metrics={metrics} user={profileUser} signedIn />
        )
      ) : (
        <ProfileStats metrics={getFallbackMetrics()} user={null} signedIn={false} />
      )}

      <div id="profile-editor" className="space-y-4 scroll-mt-8">
        {signedIn ? (
          <ProfileEditor
            initialUser={profileUser}
            onProfileUpdated={handleProfileUpdated}
          />
        ) : (
          <ProfileGuestCard />
        )}
      </div>

      {signedIn ? (
        isLoading && !summary ? (
          <ProfileHistorySkeleton />
        ) : (
          <ProfileHistory signedIn sessions={sessions} />
        )
      ) : (
        <ProfileHistory signedIn={false} sessions={[]} />
      )}
    </div>
  );
}
