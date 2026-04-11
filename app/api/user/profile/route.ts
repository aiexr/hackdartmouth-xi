import { getOptionalServerSession } from "@/lib/auth";
import { UserModel } from "@/lib/models";

export async function GET() {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await UserModel.getUserByEmail(session.user.email);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(user);
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
    const body = await request.json();
    const { name, bio, resumeUrl, focusTrack, preferences } = body;

    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (resumeUrl !== undefined) updates.resumeUrl = resumeUrl;
    if (focusTrack !== undefined) updates.focusTrack = focusTrack;
    if (preferences !== undefined) updates.preferences = preferences;

    const updatedUser = await UserModel.updateUserProfile(session.user.email, updates as any);

    if (!updatedUser) {
      console.error("updateUserProfile returned null for email:", session.user.email);
      return Response.json({ error: "Failed to update profile - user not found or DB connection failed" }, { status: 500 });
    }

    return Response.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: `Failed to update profile: ${errorMessage}` }, { status: 500 });
  }
}
