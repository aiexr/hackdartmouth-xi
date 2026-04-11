import "server-only";

import { improvementThemes, roleTracks, scenarios } from "@/data/scenarios";
import { env } from "@/lib/env";
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

type TrackMetric = {
  id: string;
  name: string;
  description: string;
  gradient: string;
  completed: number;
  total: number;
  sessions: number;
  averageScore: number | null;
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

type MasteryMetric = {
  name: string;
  level: number;
  sessions: number;
  label: string;
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
  activeTrackCount: number;
  topTrackName: string | null;
  goals: GoalMetric[];
  tracks: TrackMetric[];
  improvements: ImprovementMetric[];
  profileStats: ProfileStat[];
  mastery: MasteryMetric[];
  achievements: AchievementMetric[];
};

const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));

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

function getTrackId(interview: InterviewRecord) {
  if (!interview.scenarioId) {
    return null;
  }

  return scenarioById.get(interview.scenarioId)?.trackId ?? null;
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

  return improvementThemes;
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
      weeklyTarget: 4,
      remainingLoops: 4,
      streakDays: 0,
      activeTrackCount: 0,
      topTrackName: null,
      goals: [
        { label: "Complete 4 practice loops this week", current: 0, total: 4 },
        { label: "Practice all role tracks", current: 0, total: roleTracks.length },
        { label: "Hit a 90+ score once", current: 0, total: 90 },
      ],
      tracks: roleTracks.map((track) => ({
        ...track,
        completed: 0,
        sessions: 0,
        averageScore: null,
      })),
      improvements: improvementThemes,
      profileStats: [
        { label: "Sessions", value: "0", accent: "text-primary" },
        { label: "Average Score", value: "--", accent: "text-emerald-500" },
        { label: "Tracks Active", value: "0", accent: "text-sky-500" },
        { label: "Best Attempt", value: "--", accent: "text-amber-500" },
      ],
      mastery: roleTracks.map((track) => ({
        name: track.name,
        level: 0,
        sessions: 0,
        label: "No scored sessions yet",
      })),
      achievements: [
        { icon: "🔥", title: "No streak yet", description: "Complete a practice loop to start building momentum." },
        { icon: "🎯", title: "First score pending", description: "Finish one graded interview to unlock score tracking." },
        { icon: "📈", title: "Progress starts here", description: "Dashboard goals will fill in as interview history lands in MongoDB." },
        { icon: "🧠", title: "Explore every track", description: "Practice across each role track to unlock broader feedback patterns." },
      ],
    };
  }

  let db = null;
  try {
    db = await getMongoDb();
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
      weeklyTarget: 4,
      remainingLoops: 4,
      streakDays: 0,
      activeTrackCount: 0,
      topTrackName: null,
      goals: [
        { label: "Complete 4 practice loops this week", current: 0, total: 4 },
        { label: "Practice all role tracks", current: 0, total: roleTracks.length },
        { label: "Hit a 90+ score once", current: 0, total: 90 },
      ],
      tracks: roleTracks.map((track) => ({
        ...track,
        completed: 0,
        sessions: 0,
        averageScore: null,
      })),
      improvements: improvementThemes,
      profileStats: [
        { label: "Sessions", value: "0", accent: "text-primary" },
        { label: "Average Score", value: "--", accent: "text-emerald-500" },
        { label: "Tracks Active", value: "0", accent: "text-sky-500" },
        { label: "Best Attempt", value: "--", accent: "text-amber-500" },
      ],
      mastery: roleTracks.map((track) => ({
        name: track.name,
        level: 0,
        sessions: 0,
        label: "No scored sessions yet",
      })),
      achievements: [
        { icon: "🔥", title: "No streak yet", description: "Complete a practice loop to start building momentum." },
        { icon: "🎯", title: "First score pending", description: "Finish one graded interview to unlock score tracking." },
        { icon: "📈", title: "Progress starts here", description: "Dashboard goals will fill in as interview history lands in MongoDB." },
        { icon: "🧠", title: "Explore every track", description: "Practice across each role track to unlock broader feedback patterns." },
      ],
    };
  }

  const rawInterviews = (await db
    .collection("interviews")
    .find({ userId: userEmail })
    .sort({ createdAt: -1 })
    .toArray()) as InterviewRecord[];

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

  const weeklyTarget = 4;
  const bestScore = gradedSessions.length
    ? Math.max(...gradedSessions.map((interview) => interview.overallScore))
    : null;
  const averageScore = average(gradedSessions.map((interview) => interview.overallScore));

  const trackSummaries = roleTracks.map((track) => {
    const trackInterviews = rawInterviews.filter(
      (interview) => getTrackId(interview) === track.id,
    );
    const completedScenarioIds = new Set(
      trackInterviews
        .filter((interview) => interview.status === "completed" && interview.scenarioId)
        .map((interview) => interview.scenarioId as string),
    );
    const scoredInterviews = trackInterviews.filter(
      (interview): interview is InterviewRecord & { overallScore: number } =>
        typeof interview.overallScore === "number",
    );

    return {
      ...track,
      completed: Math.min(completedScenarioIds.size, track.total),
      sessions: trackInterviews.length,
      averageScore: average(scoredInterviews.map((interview) => interview.overallScore)),
    };
  });

  const topTrack = [...trackSummaries]
    .sort((left, right) => right.sessions - left.sessions)[0];
  const activeTrackCount = trackSummaries.filter((track) => track.sessions > 0).length;
  const streakDays = getCurrentStreak(completedSessions);

  return {
    hasSession: true,
    databaseReady: true,
    totalSessions: rawInterviews.length,
    completedSessions: completedSessions.length,
    gradedSessions: gradedSessions.length,
    averageScore,
    bestScore,
    weeklyCompleted,
    weeklyTarget,
    remainingLoops: Math.max(weeklyTarget - weeklyCompleted, 0),
    streakDays,
    activeTrackCount,
    topTrackName: topTrack?.sessions ? topTrack.name : null,
    goals: [
      { label: "Complete 4 practice loops this week", current: weeklyCompleted, total: weeklyTarget },
      { label: "Practice all role tracks", current: activeTrackCount, total: roleTracks.length },
      { label: "Hit a 90+ score once", current: Math.min(bestScore ?? 0, 90), total: 90 },
    ],
    tracks: trackSummaries,
    improvements: buildImprovements(gradedSessions),
    profileStats: [
      { label: "Sessions", value: `${rawInterviews.length}`, accent: "text-primary" },
      {
        label: "Average Score",
        value: averageScore === null ? "--" : `${averageScore}`,
        accent: "text-emerald-500",
      },
      { label: "Tracks Active", value: `${activeTrackCount}`, accent: "text-sky-500" },
      {
        label: "Best Attempt",
        value: bestScore === null ? "--" : `${bestScore}`,
        accent: "text-amber-500",
      },
    ],
    mastery: trackSummaries.map((track) => ({
      name: track.name,
      level: track.averageScore ?? 0,
      sessions: track.sessions,
      label:
        track.averageScore === null
          ? track.sessions
            ? "Awaiting score"
            : "No sessions yet"
          : `${track.averageScore}% average`,
    })),
    achievements: [
      {
        icon: "🔥",
        title: streakDays ? `${streakDays}-day streak` : "No streak yet",
        description: streakDays
          ? "Completed interview sessions on consecutive days."
          : "Complete a practice loop today to start a streak.",
      },
      {
        icon: "🎯",
        title:
          bestScore === null ? "First score pending" : `${bestScore} best attempt`,
        description:
          bestScore === null
            ? "Finish a graded interview to surface your strongest attempt."
            : "Top scored mock interview recorded in MongoDB.",
      },
      {
        icon: "📈",
        title:
          averageScore === null ? "Score trend pending" : `${averageScore} average score`,
        description:
          averageScore === null
            ? "Average score will appear after your first graded session."
            : `${gradedSessions.length} graded interview${gradedSessions.length === 1 ? "" : "s"} contributing to the running average.`,
      },
      {
        icon: "🧠",
        title:
          activeTrackCount === 0
            ? "Track explorer"
            : `${activeTrackCount}/${roleTracks.length} tracks active`,
        description:
          activeTrackCount === 0
            ? "Practice across different tracks to diversify the feedback model."
            : `Most active track: ${topTrack?.name ?? "None yet"}.`,
      },
    ],
  };
}
