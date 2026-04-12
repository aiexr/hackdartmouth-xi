import "server-only";

import { scenarios } from "@/data/scenarios";
import { env } from "@/lib/env";
import { UserModel } from "@/lib/models/User";
import { getMongoDb } from "@/lib/mongodb";

type InterviewRecord = {
  scenarioId?: string | null;
  status?: string | null;
  overallScore?: number | null;
  gradingResult?: {
    improvements?: unknown;
  } | null;
  createdAt?: Date | string | null;
  completedAt?: Date | string | null;
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

type AchievementMetric = {
  icon: string;
  title: string;
  description: string;
};

type ProfileStat = {
  label: string;
  value: string;
  accent: string;
};

export type ActivityDay = {
  date: string; // YYYY-MM-DD
  count: number;
};

export type UserInterviewMetrics = {
  hasSession: boolean;
  databaseReady: boolean;
  totalSessions: number;
  completedSessions: number;
  gradedSessions: number;
  averageScore: number | null;
  bestScore: number | null;
  weeklyCompleted: number;
  weeklyTarget: number;
  remainingLoops: number;
  streakDays: number;
  longestStreak: number;
  activityDays: ActivityDay[];
  goals: GoalMetric[];
  improvements: ImprovementMetric[];
  profileStats: ProfileStat[];
  achievements: AchievementMetric[];
};

const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
const DEFAULT_WEEKLY_TARGET = 4;

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function average(numbers: number[]) {
  if (!numbers.length) {
    return null;
  }

  return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);

  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);

  return value;
}

function toDayKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

function getCurrentStreak(interviews: InterviewRecord[]) {
  const activeDays = new Set(
    interviews
      .map((interview) => toDate(interview.completedAt ?? interview.createdAt))
      .filter((date): date is Date => Boolean(date))
      .map(toDayKey),
  );

  if (!activeDays.size) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (activeDays.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getLongestStreak(interviews: InterviewRecord[]) {
  const activeDays = [
    ...new Set(
      interviews
        .map((interview) => toDate(interview.completedAt ?? interview.createdAt))
        .filter((date): date is Date => Boolean(date))
        .map(toDayKey),
    ),
  ].sort();

  if (!activeDays.length) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < activeDays.length; i++) {
    const prev = new Date(activeDays[i - 1]);
    const curr = new Date(activeDays[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function getActivityDays(interviews: InterviewRecord[]): ActivityDay[] {
  const counts = new Map<string, number>();

  for (const interview of interviews) {
    const date = toDate(interview.completedAt ?? interview.createdAt);
    if (!date) continue;
    const key = toDayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Build a full grid of the last 365 days
  const days: ActivityDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDayKey(d);
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return days;
}

function buildImprovements(interviews: InterviewRecord[]) {
  const items: ImprovementMetric[] = [];

  for (const interview of interviews) {
    const feedback = interview.gradingResult?.improvements;
    if (!Array.isArray(feedback)) {
      continue;
    }

    for (const value of feedback) {
      if (typeof value !== "string" || !value.trim()) {
        continue;
      }

      const scenario = interview.scenarioId ? scenarioById.get(interview.scenarioId) : null;
      const title = value.length > 54 ? `${value.slice(0, 51).trimEnd()}...` : value;

      items.push({
        id: `${interview.scenarioId ?? "general"}-${items.length}`,
        title,
        tag: scenario?.trackLabel ?? "Interview feedback",
        source: scenario?.title ?? "Recent practice",
        description: value,
      });

      if (items.length === 2) {
        return items;
      }
    }
  }

  return [];
}

export async function getUserInterviewMetrics(
  userEmail?: string | null,
): Promise<UserInterviewMetrics> {
  const mongoConfigured = Boolean(env.mongodbUri);

  if (!userEmail) {
    return {
      hasSession: false,
      databaseReady: mongoConfigured,
      totalSessions: 0,
      completedSessions: 0,
      gradedSessions: 0,
      averageScore: null,
      bestScore: null,
      weeklyCompleted: 0,
      weeklyTarget: DEFAULT_WEEKLY_TARGET,
      remainingLoops: DEFAULT_WEEKLY_TARGET,
      streakDays: 0,
      longestStreak: 0,
      activityDays: getActivityDays([]),
      goals: [
        {
          label: `Complete ${DEFAULT_WEEKLY_TARGET} practice loops this week`,
          current: 0,
          total: DEFAULT_WEEKLY_TARGET,
        },
        { label: "Hit a 90+ score once", current: 0, total: 90 },
      ],
      improvements: [],
      profileStats: [
        { label: "Sessions", value: "0", accent: "text-primary" },
        { label: "Average Score", value: "--", accent: "text-emerald-500" },
        { label: "Best Attempt", value: "--", accent: "text-amber-500" },
      ],
      achievements: [
        { icon: "flame", title: "No streak yet", description: "Complete a practice loop to start building momentum." },
        { icon: "target", title: "First score pending", description: "Finish one graded interview to unlock score tracking." },
        { icon: "trending-up", title: "Progress starts here", description: "Complete a graded interview to start tracking progress." },
      ],
    };
  }

  let db = null;
  try {
    db = await withTimeout(getMongoDb(), 4500, "MongoDB connection timed out.");
  } catch {
    db = null;
  }

  if (!db) {
    return {
      hasSession: Boolean(userEmail),
      databaseReady: false,
      totalSessions: 0,
      completedSessions: 0,
      gradedSessions: 0,
      averageScore: null,
      bestScore: null,
      weeklyCompleted: 0,
      weeklyTarget: DEFAULT_WEEKLY_TARGET,
      remainingLoops: DEFAULT_WEEKLY_TARGET,
      streakDays: 0,
      longestStreak: 0,
      activityDays: getActivityDays([]),
      goals: [
        {
          label: `Complete ${DEFAULT_WEEKLY_TARGET} practice loops this week`,
          current: 0,
          total: DEFAULT_WEEKLY_TARGET,
        },
        { label: "Hit a 90+ score once", current: 0, total: 90 },
      ],
      improvements: [],
      profileStats: [
        { label: "Sessions", value: "0", accent: "text-primary" },
        { label: "Average Score", value: "--", accent: "text-emerald-500" },
        { label: "Best Attempt", value: "--", accent: "text-amber-500" },
      ],
      achievements: [
        { icon: "flame", title: "No streak yet", description: "Complete a practice loop to start building momentum." },
        { icon: "target", title: "First score pending", description: "Finish one graded interview to unlock score tracking." },
        { icon: "trending-up", title: "Progress starts here", description: "Complete a graded interview to start tracking progress." },
      ],
    };
  }

  let databaseReady = true;
  let rawInterviews: InterviewRecord[] = [];
  try {
    const interviewsCursor = db
      .collection("interviews")
      .find({ userId: userEmail }, { maxTimeMS: 4000 })
      .sort({ createdAt: -1 });
    rawInterviews = await withTimeout(
      interviewsCursor.toArray() as Promise<InterviewRecord[]>,
      4500,
      "Interview metrics query timed out.",
    );
  } catch {
    databaseReady = false;
  }

  const completedSessions = rawInterviews.filter((interview) => interview.status === "completed");
  const gradedSessions = completedSessions.filter(
    (interview): interview is InterviewRecord & { overallScore: number } =>
      typeof interview.overallScore === "number",
  );

  const start = startOfWeek(new Date());
  const weeklyCompleted = completedSessions.filter((interview) => {
    const completedAt = toDate(interview.completedAt ?? interview.createdAt);
    return completedAt ? completedAt >= start : false;
  }).length;

  const dbUser = await withTimeout(
    UserModel.getUserByEmail(userEmail),
    3000,
    "User profile query timed out.",
  ).catch(() => null);
  const weeklyTarget = Math.max(
    1,
    Math.round(dbUser?.preferences?.weeklyGoal ?? DEFAULT_WEEKLY_TARGET),
  );
  const bestScore = gradedSessions.length
    ? Math.max(...gradedSessions.map((interview) => interview.overallScore))
    : null;
  const averageScore = average(gradedSessions.map((interview) => interview.overallScore));

  const streakDays = getCurrentStreak(completedSessions);
  const longestStreak = getLongestStreak(completedSessions);
  const activityDays = getActivityDays(completedSessions);

  return {
    hasSession: true,
    databaseReady,
    totalSessions: rawInterviews.length,
    completedSessions: completedSessions.length,
    gradedSessions: gradedSessions.length,
    averageScore,
    bestScore,
    weeklyCompleted,
    weeklyTarget,
    remainingLoops: Math.max(weeklyTarget - weeklyCompleted, 0),
    streakDays,
    longestStreak,
    activityDays,
    goals: [
      {
        label: `Complete ${weeklyTarget} practice loops this week`,
        current: weeklyCompleted,
        total: weeklyTarget,
      },
      { label: "Hit a 90+ score once", current: Math.min(bestScore ?? 0, 90), total: 90 },
    ],
    improvements: buildImprovements(gradedSessions),
    profileStats: [
      { label: "Sessions", value: `${rawInterviews.length}`, accent: "text-primary" },
      {
        label: "Average Score",
        value: averageScore === null ? "--" : `${averageScore}`,
        accent: "text-emerald-500",
      },
      {
        label: "Best Attempt",
        value: bestScore === null ? "--" : `${bestScore}`,
        accent: "text-amber-500",
      },
    ],
    achievements: [
      {
        icon: "flame",
        title: streakDays ? `${streakDays}-day streak` : "No streak yet",
        description: streakDays
          ? "Completed interview sessions on consecutive days."
          : "Complete a practice loop today to start a streak.",
      },
      {
        icon: "target",
        title:
          bestScore === null ? "First score pending" : `${bestScore} best attempt`,
        description:
          bestScore === null
            ? "Finish a graded interview to surface your strongest attempt."
            : "Your strongest interview session.",
      },
      {
        icon: "trending-up",
        title:
          averageScore === null ? "Score trend pending" : `${averageScore} average score`,
        description:
          averageScore === null
            ? "Average score will appear after your first graded session."
            : `${gradedSessions.length} graded interview${gradedSessions.length === 1 ? "" : "s"} contributing to the running average.`,
      },
    ],
  };
}
