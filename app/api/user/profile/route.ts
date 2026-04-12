import { getOptionalServerSession } from "@/lib/auth";
import { UserModel } from "@/lib/models";

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

export async function GET() {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    let user = await UserModel.getUserByEmail(session.user.email);

    if (!user) {
      user = await UserModel.findOrCreateUser(
        session.user.email,
        session.user.name ?? "",
        session.user.image ?? "",
        "google",
      );
    }

    return Response.json(sanitizeUserForClient(user));
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const rawBody: unknown = await request.json();
    const body =
      rawBody && typeof rawBody === "object"
        ? (rawBody as Record<string, unknown>)
        : {};
    const { name, bio, focusTrack, preferences, weeklyGoal } = body;

    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (focusTrack !== undefined) updates.focusTrack = focusTrack;
    let parsedWeeklyGoal: number | undefined;
    if (typeof weeklyGoal === "number" && Number.isFinite(weeklyGoal)) {
      parsedWeeklyGoal = Math.min(30, Math.max(1, Math.round(weeklyGoal)));
    }

    if (preferences !== undefined || parsedWeeklyGoal !== undefined) {
      let user = await UserModel.getUserByEmail(session.user.email);
      if (!user) {
        user = await UserModel.findOrCreateUser(
          session.user.email,
          session.user.name ?? "",
          session.user.image ?? "",
          "google",
        );
      }

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
