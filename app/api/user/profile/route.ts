import { getOptionalServerSession } from "@/lib/auth";
import { getOptionalMongoDb } from "@/lib/mongodb";
import { UserModel, type User } from "@/lib/models";

function sanitizeUserForClient(user: Awaited<ReturnType<typeof UserModel.getUserByEmail>>) {
  if (!user) {
    return null;
  }

  const { resumeExtractedText, ...publicUser } = user;
  return {
    ...publicUser,
    hasResumeContext: Boolean(resumeExtractedText?.trim()),
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
    },
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
      );
    }

    const existingUser = await UserModel.getUserByEmail(session.user.email);
    const user =
      existingUser ??
      (await UserModel.findOrCreateUser(
        session.user.email,
        session.user.name ?? "",
        session.user.image ?? "",
        "google",
      ));

    return Response.json(sanitizeUserForClient(user));
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

    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (focusTrack !== undefined) updates.focusTrack = focusTrack;
    if (resumeExtractedText !== undefined) updates.resumeExtractedText = resumeExtractedText;
    let parsedWeeklyGoal: number | undefined;
    if (typeof weeklyGoal === "number" && Number.isFinite(weeklyGoal)) {
      parsedWeeklyGoal = Math.min(30, Math.max(1, Math.round(weeklyGoal)));
    }

    if (preferences !== undefined || parsedWeeklyGoal !== undefined) {
      const user = await UserModel.findOrCreateUser(
        session.user.email,
        session.user.name ?? "",
        session.user.image ?? "",
        "google",
      );

      const basePreferences =
        user.preferences ?? {
          voiceId: null,
          feedbackStyle: "structured" as const,
          practiceReminders: true,
          weeklyGoal: 4,
        };

      const mergedPreferences =
        preferences && typeof preferences === "object"
          ? {
              ...basePreferences,
              ...(preferences as Record<string, unknown>),
            }
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
