import { scenarios } from "@/data/scenarios";
import { getOptionalServerSession } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";
import { InterviewModel, UserModel, type User } from "@/lib/models";

const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));

function sanitizeUserForClient(
  user:
    | Awaited<ReturnType<typeof UserModel.getUserByEmail>>
    | Awaited<ReturnType<typeof UserModel.getUserProfileByEmail>>,
) {
  if (!user) {
    return null;
  }

  const hasResumeContext =
    typeof (user as unknown as { hasResumeContext?: unknown }).hasResumeContext === "boolean"
      ? ((user as unknown as { hasResumeContext: boolean }).hasResumeContext ?? false)
      : Boolean(
          (
            user as {
              resumeExtractedText?: string | null;
            }
          ).resumeExtractedText?.trim(),
        );
  const publicUser = { ...user } as Record<string, unknown>;
  delete publicUser.resumeExtractedText;

  return {
    ...publicUser,
    hasResumeContext,
  };
}

function buildFallbackUserProfile({
  email,
  name,
  image,
}: {
  email: string;
  name?: string | null;
  image?: string | null;
}): User {
  const now = new Date();

  return {
    email,
    name: name ?? "",
    image: image ?? "",
    provider: "google",
    focusTrack: null,
    bio: null,
    resumeExtractedText: null,
    preferences: {
      voiceId: null,
      feedbackStyle: "structured",
      practiceReminders: true,
      weeklyGoal: 4,
      interviewWrapUpMinutes: null,
    },
    favorites: [],
    createdAt: now,
    updatedAt: now,
  };
}

function formatScenarioTitleFromId(scenarioId: string) {
  const normalized = scenarioId
    .replace(/^lc-/, "")
    .replace(/^quant-/, "")
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

  return normalized || "Practice session";
}

function getHistoryScenarioMeta(scenarioId: string | null) {
  if (!scenarioId) {
    return {
      title: "Practice session",
      categoryLabel: "Interview",
      trackLabel: null,
      difficultyLabel: null,
    };
  }

  const scenario = scenarioById.get(scenarioId);
  if (scenario) {
    return {
      title: scenario.title,
      categoryLabel: scenario.category.replace(/-/g, " "),
      trackLabel: scenario.trackLabel,
      difficultyLabel: scenario.difficulty,
    };
  }

  return {
    title: formatScenarioTitleFromId(scenarioId),
    categoryLabel: scenarioId.startsWith("lc-")
      ? "LeetCode"
      : scenarioId.startsWith("quant-")
        ? "Quant"
        : "Interview",
    trackLabel: null,
    difficultyLabel: null,
  };
}

export async function GET() {
  const session = await getOptionalServerSession().catch(() => null);
  const email = session?.user?.email;

  if (!email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userPromise = UserModel.getUserProfileByEmail(email).catch(() => null);
  const interviewsPromise = InterviewModel.getInterviewHistoryByUser(email).catch(() => []);
  const dbUser = await userPromise;
  const [metrics, interviews] = await Promise.all([
    getUserInterviewMetrics(email, {
      weeklyTarget: dbUser?.preferences?.weeklyGoal ?? null,
    }).catch(() => getUserInterviewMetrics()),
    interviewsPromise,
  ]);

  const user =
    sanitizeUserForClient(dbUser) ??
    sanitizeUserForClient(
      buildFallbackUserProfile({
        email,
        name: session.user?.name,
        image: session.user?.image,
      }),
    );

  const sessions = interviews
    .filter((interview) => {
      const status = String(interview.status ?? "").toLowerCase();
      return Boolean(interview.completedAt) || status === "completed" || status === "graded";
    })
    .sort((left, right) => {
      const leftTime = new Date(left.completedAt ?? left.createdAt ?? 0).getTime();
      const rightTime = new Date(right.completedAt ?? right.createdAt ?? 0).getTime();
      return leftTime - rightTime;
    })
    .map((interview) => {
      const scenarioId = interview.scenarioId ?? null;
      const scenarioMeta = getHistoryScenarioMeta(scenarioId);
      const transcriptCount = interview.transcriptCount ?? 0;
      const overallScore =
        typeof interview.overallScore === "number"
          ? Math.max(0, Math.min(100, Math.round(interview.overallScore)))
          : null;
      const letterGrade =
        typeof interview.letterGrade === "string" ? interview.letterGrade : null;
      const interviewId = interview._id
        ? String(interview._id)
        : `${interview.createdAt?.toISOString?.() ?? "session"}-${scenarioId ?? "unknown"}`;

      return {
        id: interviewId,
        scenarioId,
        title: scenarioMeta.title,
        categoryLabel: scenarioMeta.categoryLabel,
        trackLabel: scenarioMeta.trackLabel,
        difficultyLabel: scenarioMeta.difficultyLabel,
        completedAt: interview.completedAt ? interview.completedAt.toISOString() : null,
        createdAt: interview.createdAt ? interview.createdAt.toISOString() : null,
        overallScore,
        letterGrade,
        transcriptCount,
        reviewHref: `/review/${scenarioId ?? "interview"}?interviewId=${interviewId}`,
      };
    });

  const previousScoreByScenario = new Map<string, number>();
  const sessionsWithDelta = sessions.map((sessionRecord) => {
    const previousScore =
      sessionRecord.scenarioId && typeof sessionRecord.overallScore === "number"
        ? previousScoreByScenario.get(sessionRecord.scenarioId) ?? null
        : null;
    const scoreDelta =
      typeof sessionRecord.overallScore === "number" && previousScore !== null
        ? sessionRecord.overallScore - previousScore
        : null;

    if (sessionRecord.scenarioId && typeof sessionRecord.overallScore === "number") {
      previousScoreByScenario.set(sessionRecord.scenarioId, sessionRecord.overallScore);
    }

    return {
      ...sessionRecord,
      scoreDelta,
    };
  });

  const descendingSessions = sessionsWithDelta
    .slice()
    .sort((left, right) => {
      const leftTime = new Date(left.completedAt ?? left.createdAt ?? 0).getTime();
      const rightTime = new Date(right.completedAt ?? right.createdAt ?? 0).getTime();
      return rightTime - leftTime;
    });

  return Response.json(
    {
      user,
      metrics,
      sessions: descendingSessions,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}
