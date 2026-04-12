import { getOptionalServerSession } from "@/lib/auth";
import { getOptionalMongoDb } from "@/lib/mongodb";
import { UserModel, type User } from "@/lib/models";

const WEEKLY_GOAL_MIN = 1;
const WEEKLY_GOAL_MAX = 30;
const INTERVIEW_WRAP_UP_MIN = 1;
const INTERVIEW_WRAP_UP_MAX = 60;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function sanitizePreferences(
  preferences: User["preferences"] | Record<string, unknown> | null | undefined,
): User["preferences"] {
  const raw = asRecord(preferences);

  return {
    voiceId:
      typeof raw.voiceId === "string" || raw.voiceId === null
        ? (raw.voiceId as string | null)
        : null,
    feedbackStyle:
      raw.feedbackStyle === "detailed" ||
      raw.feedbackStyle === "concise" ||
      raw.feedbackStyle === "structured"
        ? (raw.feedbackStyle as User["preferences"]["feedbackStyle"])
        : "structured",
    practiceReminders:
      typeof raw.practiceReminders === "boolean"
        ? raw.practiceReminders
        : true,
    weeklyGoal:
      typeof raw.weeklyGoal === "number" && Number.isFinite(raw.weeklyGoal)
        ? Math.min(WEEKLY_GOAL_MAX, Math.max(WEEKLY_GOAL_MIN, Math.round(raw.weeklyGoal)))
        : 4,
    interviewWrapUpMinutes:
      raw.interviewWrapUpMinutes === null
        ? null
        : typeof raw.interviewWrapUpMinutes === "number" &&
            Number.isFinite(raw.interviewWrapUpMinutes)
          ? Math.min(
              INTERVIEW_WRAP_UP_MAX,
              Math.max(INTERVIEW_WRAP_UP_MIN, Math.round(raw.interviewWrapUpMinutes)),
            )
          : null,
  };
}

function validateInterviewWrapUpPreference(value: unknown) {
  if (
    value !== undefined &&
    value !== null &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    return "Wrap-up timing must be a whole number between 1 and 60 minutes or cleared.";
  }

  return null;
}

function sanitizeUserForClient(
  user:
    | Awaited<ReturnType<typeof UserModel.getUserByEmail>>
    | Awaited<ReturnType<typeof UserModel.getUserProfileByEmail>>,
) {
  if (!user) {
    return null;
  }

  const hasResumeContext =
    typeof (user as { hasResumeContext?: unknown }).hasResumeContext === "boolean"
      ? ((user as { hasResumeContext: boolean }).hasResumeContext ?? false)
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
    preferences: sanitizePreferences(user.preferences),
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
    preferences: sanitizePreferences(null),
    favorites: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function GET() {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const db = await getOptionalMongoDb();
    if (!db) {
      return Response.json(
        sanitizeUserForClient(
          buildFallbackUserProfile({
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
          }),
        ),
        {
          headers: {
            "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
          },
        },
      );
    }

    const existingUser = await UserModel.getUserProfileByEmail(session.user.email);
    const user =
      existingUser ??
      buildFallbackUserProfile({
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      });

    return Response.json(sanitizeUserForClient(user), {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return Response.json(
      sanitizeUserForClient(
        buildFallbackUserProfile({
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        }),
      ),
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getOptionalMongoDb();
  if (!db) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const rawBody: unknown = await request.json();
    const body =
      rawBody && typeof rawBody === "object"
        ? (rawBody as Record<string, unknown>)
        : {};
    const { name, bio, focusTrack, preferences, weeklyGoal, resumeExtractedText } = body;
    const rawPreferences = preferences && typeof preferences === "object"
      ? (preferences as Record<string, unknown>)
      : null;

    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (focusTrack !== undefined) updates.focusTrack = focusTrack;
    if (resumeExtractedText !== undefined) updates.resumeExtractedText = resumeExtractedText;
    let parsedWeeklyGoal: number | undefined;
    if (typeof weeklyGoal === "number" && Number.isFinite(weeklyGoal)) {
      parsedWeeklyGoal = Math.min(WEEKLY_GOAL_MAX, Math.max(WEEKLY_GOAL_MIN, Math.round(weeklyGoal)));
    }

    if (preferences !== undefined || parsedWeeklyGoal !== undefined) {
      const user = await UserModel.findOrCreateUser(
        session.user.email,
        session.user.name ?? "",
        session.user.image ?? "",
        "google",
      );

      const basePreferences = sanitizePreferences(user.preferences);

      const interviewWrapUpValidationError = validateInterviewWrapUpPreference(
        rawPreferences?.interviewWrapUpMinutes,
      );
      if (interviewWrapUpValidationError) {
        return Response.json({ error: interviewWrapUpValidationError }, { status: 400 });
      }

      const mergedPreferences =
        rawPreferences
          ? sanitizePreferences({
              ...basePreferences,
              ...rawPreferences,
            })
          : { ...basePreferences };

      if (parsedWeeklyGoal !== undefined) {
        mergedPreferences.weeklyGoal = parsedWeeklyGoal;
      }

      updates.preferences = mergedPreferences;
    }

    const updatedUser = await UserModel.updateUserProfile(session.user.email, updates as any);

    if (!updatedUser) {
      console.error("updateUserProfile returned null for email:", session.user.email);
      return Response.json({ error: "Failed to update profile - user not found or DB connection failed" }, { status: 500 });
    }

    return Response.json(sanitizeUserForClient(updatedUser));
  } catch (error) {
    console.error("Failed to update user profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: `Failed to update profile: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getOptionalMongoDb();
  if (!db) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const email = session.user.email;

    const [
      userResult,
      metricsResult,
      resumeResult,
      interviewsResult,
      profileContextResult,
    ] = await Promise.all([
      db.collection("users").deleteOne({ email }),
      db.collection("userMetrics").deleteOne({ email }),
      db.collection("user_resumes").deleteOne({ email }),
      db.collection("interviews").deleteMany({
        $or: [{ email }, { userId: email }],
      }),
      db.collection("user_profiles").deleteMany({ userId: email }),
    ]);

    return Response.json({
      ok: true,
      deleted: {
        users: userResult.deletedCount,
        userMetrics: metricsResult.deletedCount,
        userResumes: resumeResult.deletedCount,
        interviews: interviewsResult.deletedCount,
        userProfiles: profileContextResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Failed to delete account data:", error);
    return Response.json({ error: "Failed to delete account data" }, { status: 500 });
  }
}
