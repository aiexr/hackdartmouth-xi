import "server-only";

import { scenarios, type Scenario } from "@/data/scenarios";
import { env } from "@/lib/env";
import { UserModel } from "@/lib/models/User";
import { getMongoDb } from "@/lib/mongodb";

type InterviewRecord = {
  scenarioId?: string | null;
  type?: string | null;
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

type ScenarioCategory = Scenario["category"];

type SuggestedScenarioMetric = {
  id: string;
  title: string;
  category: ScenarioCategory;
  trackLabel: string;
  difficulty: Scenario["difficulty"];
  duration: string;
  focusLabel: string;
  href: string;
  reason: string;
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
  suggestedScenarios: SuggestedScenarioMetric[];
  goals: GoalMetric[];
  improvements: ImprovementMetric[];
  profileStats: ProfileStat[];
  achievements: AchievementMetric[];
};

const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
const DEFAULT_WEEKLY_TARGET = 4;
const CATEGORY_ORDER: ScenarioCategory[] = ["technical", "system-design", "behavioral"];
const DIFFICULTY_RANK: Record<Scenario["difficulty"], number> = {
  Foundations: 0,
  Growth: 1,
  Stretch: 2,
};
const STARTER_SCENARIO_IDS = [
  "technical-two-sum",
  "technical-valid-parentheses",
  "system-url-shortener",
  "system-feature-flags",
  "staff-swe-story",
] as const;
const CATEGORY_RECOMMENDATION_POOLS: Record<ScenarioCategory, string[]> = {
  technical: [
    "technical-two-sum",
    "technical-valid-parentheses",
    "technical-buy-sell-stock",
    "technical-merge-intervals",
    "technical-number-of-islands",
    "technical-top-k-frequent",
    "technical-lru-cache",
    "technical-word-ladder",
    "technical-coin-change",
  ],
  "system-design": [
    "system-url-shortener",
    "system-feature-flags",
    "system-resume-ingestion",
    "system-realtime-chat",
    "system-collaborative-editor",
    "system-ai-grading-pipeline",
    "system-live-interview-platform",
    "system-news-feed-ranking",
    "staff-swe-system-design-intro",
  ],
  behavioral: [
    "staff-swe-story",
    "staff-swe-mentorship",
    "staff-swe-conflict",
    "staff-swe-technical-disagreement",
    "pm-product-sense",
    "pm-prioritization",
    "consulting-market-sizing",
    "consulting-synthesis",
  ],
};

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

  // Keep the full recorded span so the calendar can render whole Jan-Dec years on demand.
  const days: ActivityDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const earliestInterviewDate = interviews
    .map((interview) => toDate(interview.completedAt ?? interview.createdAt))
    .filter((date): date is Date => Boolean(date))
    .sort((left, right) => left.getTime() - right.getTime())[0] ?? null;

  const start = earliestInterviewDate ? new Date(earliestInterviewDate) : new Date(today);
  start.setHours(0, 0, 0, 0);

  while (start <= today) {
    const key = toDayKey(start);
    days.push({ date: key, count: counts.get(key) ?? 0 });
    start.setDate(start.getDate() + 1);
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

function getInterviewCategory(interview: InterviewRecord): ScenarioCategory | null {
  const scenario = interview.scenarioId ? scenarioById.get(interview.scenarioId) : null;
  if (scenario) {
    return scenario.category;
  }

  if (
    interview.type === "behavioral" ||
    interview.type === "technical" ||
    interview.type === "system-design"
  ) {
    return interview.type;
  }

  return null;
}

function getOrderedCategoryScenarios(category: ScenarioCategory) {
  const pool = CATEGORY_RECOMMENDATION_POOLS[category];
  const seen = new Set<string>();
  const ordered: Scenario[] = [];

  for (const scenarioId of pool) {
    const scenario = scenarioById.get(scenarioId);
    if (!scenario || seen.has(scenario.id)) {
      continue;
    }

    ordered.push(scenario);
    seen.add(scenario.id);
  }

  const remaining = scenarios
    .filter((scenario) => scenario.category === category && !seen.has(scenario.id))
    .sort((left, right) => {
      const difficultyDiff =
        DIFFICULTY_RANK[left.difficulty] - DIFFICULTY_RANK[right.difficulty];
      if (difficultyDiff !== 0) {
        return difficultyDiff;
      }

      return left.title.localeCompare(right.title);
    });

  return [...ordered, ...remaining];
}

function toSuggestedScenarioMetric(scenario: Scenario, reason: string): SuggestedScenarioMetric {
  return {
    id: scenario.id,
    title: scenario.title,
    category: scenario.category,
    trackLabel: scenario.trackLabel,
    difficulty: scenario.difficulty,
    duration: scenario.duration,
    focusLabel: scenario.focus[0] ?? scenario.trackLabel,
    href: `/practice/${scenario.id}`,
    reason,
  };
}

function buildStarterSuggestedScenarios() {
  return STARTER_SCENARIO_IDS.map((scenarioId) => {
    const scenario = scenarioById.get(scenarioId);
    if (!scenario) {
      return null;
    }

    const reason =
      scenario.category === "technical"
        ? "Starter coding warm-up"
        : scenario.category === "system-design"
          ? "Starter architecture rep"
          : "Recommended first behavioral prompt";

    return toSuggestedScenarioMetric(scenario, reason);
  }).filter((scenario): scenario is SuggestedScenarioMetric => Boolean(scenario));
}

function buildSuggestedScenarios(
  interviews: InterviewRecord[],
  gradedInterviews: InterviewRecord[],
) {
  if (!interviews.length) {
    return buildStarterSuggestedScenarios();
  }

  const categoryCounts: Record<ScenarioCategory, number> = {
    technical: 0,
    "system-design": 0,
    behavioral: 0,
  };
  const categoryScores: Record<ScenarioCategory, number[]> = {
    technical: [],
    "system-design": [],
    behavioral: [],
  };
  const scenarioUsageCounts = new Map<string, number>();

  for (const interview of interviews) {
    const category = getInterviewCategory(interview);
    if (category) {
      categoryCounts[category] += 1;
    }

    if (interview.scenarioId && scenarioById.has(interview.scenarioId)) {
      scenarioUsageCounts.set(
        interview.scenarioId,
        (scenarioUsageCounts.get(interview.scenarioId) ?? 0) + 1,
      );
    }
  }

  for (const interview of gradedInterviews) {
    const category = getInterviewCategory(interview);
    if (!category || typeof interview.overallScore !== "number") {
      continue;
    }

    categoryScores[category].push(interview.overallScore);
  }

  const rankedCategories = [...CATEGORY_ORDER].sort((left, right) => {
    const countDiff = categoryCounts[left] - categoryCounts[right];
    if (countDiff !== 0) {
      return countDiff;
    }

    const leftAverage = average(categoryScores[left]);
    const rightAverage = average(categoryScores[right]);

    if (leftAverage === null && rightAverage !== null) {
      return -1;
    }

    if (leftAverage !== null && rightAverage === null) {
      return 1;
    }

    if (leftAverage !== null && rightAverage !== null && leftAverage !== rightAverage) {
      return leftAverage - rightAverage;
    }

    return CATEGORY_ORDER.indexOf(left) - CATEGORY_ORDER.indexOf(right);
  });

  const recentScenarioIds = new Set(
    interviews
      .slice(0, 3)
      .map((interview) => interview.scenarioId)
      .filter((scenarioId): scenarioId is string => Boolean(scenarioId && scenarioById.has(scenarioId))),
  );
  const pickedScenarioIds = new Set<string>();
  const suggestions: SuggestedScenarioMetric[] = [];
  const targetSlots = [2, 2, 1];

  const pickCategorySuggestions = (category: ScenarioCategory, limit: number) => {
    if (limit <= 0) {
      return [];
    }

    const averageScore = average(categoryScores[category]);
    const reason =
      categoryCounts[category] === 0
        ? "Fresh lane to unlock"
        : averageScore !== null && averageScore < 85
          ? "Worth another rep based on recent scores"
          : "Recommended to keep your mix balanced";
    const orderedScenarios = getOrderedCategoryScenarios(category);
    const primary = orderedScenarios.filter(
      (scenario) => !pickedScenarioIds.has(scenario.id) && !recentScenarioIds.has(scenario.id),
    );
    const fallback = orderedScenarios.filter((scenario) => !pickedScenarioIds.has(scenario.id));
    const candidates = primary.length >= limit ? primary : fallback;

    return candidates
      .slice()
      .sort((left, right) => {
        const usageDiff =
          (scenarioUsageCounts.get(left.id) ?? 0) - (scenarioUsageCounts.get(right.id) ?? 0);
        if (usageDiff !== 0) {
          return usageDiff;
        }

        return orderedScenarios.findIndex((scenario) => scenario.id === left.id) -
          orderedScenarios.findIndex((scenario) => scenario.id === right.id);
      })
      .slice(0, limit)
      .map((scenario) => toSuggestedScenarioMetric(scenario, reason));
  };

  rankedCategories.forEach((category, index) => {
    const nextSuggestions = pickCategorySuggestions(category, targetSlots[index] ?? 1);
    for (const suggestion of nextSuggestions) {
      pickedScenarioIds.add(suggestion.id);
      suggestions.push(suggestion);
    }
  });

  if (suggestions.length < 5) {
    for (const category of rankedCategories) {
      const remaining = pickCategorySuggestions(category, 5 - suggestions.length);
      for (const suggestion of remaining) {
        if (pickedScenarioIds.has(suggestion.id)) {
          continue;
        }

        pickedScenarioIds.add(suggestion.id);
        suggestions.push(suggestion);
        if (suggestions.length === 5) {
          return suggestions;
        }
      }
    }
  }

  return suggestions;
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
      suggestedScenarios: buildStarterSuggestedScenarios(),
      goals: [
        {
          label: `Complete ${DEFAULT_WEEKLY_TARGET} interviews this week`,
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
      suggestedScenarios: buildStarterSuggestedScenarios(),
      goals: [
        {
          label: `Complete ${DEFAULT_WEEKLY_TARGET} interviews this week`,
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
  const suggestedScenarios = buildSuggestedScenarios(rawInterviews, gradedSessions);

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
    suggestedScenarios,
    goals: [
      {
        label: `Complete ${weeklyTarget} interviews this week`,
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
