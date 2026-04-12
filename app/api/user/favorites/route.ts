import { getOptionalServerSession } from "@/lib/auth";
import type { FavoriteItem } from "@/lib/favorites";
import { UserModel } from "@/lib/models";

function isFavoriteItem(value: unknown): value is FavoriteItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.kind === "string" &&
    (item.kind === "scenario" || item.kind === "leetcode" || item.kind === "quant") &&
    typeof item.title === "string" &&
    item.title.length > 0 &&
    typeof item.href === "string" &&
    item.href.length > 0 &&
    (item.subtitle === undefined || item.subtitle === null || typeof item.subtitle === "string")
  );
}

async function getOrCreateAuthedUser() {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return { user: null, email: null };
  }

  let user = await UserModel.getUserByEmail(session.user.email);

  if (!user) {
    user = await UserModel.findOrCreateUser(
      session.user.email,
      session.user.name ?? "",
      session.user.image ?? "",
      "google",
    );
  }

  return { user, email: session.user.email };
}

export async function GET() {
  const { user } = await getOrCreateAuthedUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  return Response.json({ favorites: user.favorites ?? [] });
}

export async function POST(request: Request) {
  const { user, email } = await getOrCreateAuthedUser();

  if (!user || !email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const rawBody: unknown = await request.json();
    const item = rawBody && typeof rawBody === "object"
      ? (rawBody as Record<string, unknown>).item
      : null;

    if (!isFavoriteItem(item)) {
      return Response.json({ error: "Invalid favorite payload" }, { status: 400 });
    }

    const existing = user.favorites ?? [];
    const isFavorited = existing.some((favorite) => favorite.id === item.id);
    const favorites = isFavorited
      ? existing.filter((favorite) => favorite.id !== item.id)
      : [item, ...existing.filter((favorite) => favorite.id !== item.id)];

    const updatedUser = await UserModel.updateUserProfile(email, { favorites });

    if (!updatedUser) {
      return Response.json({ error: "Failed to update favorites" }, { status: 500 });
    }

    return Response.json({
      favorites: updatedUser.favorites ?? [],
      isFavorited: !isFavorited,
    });
  } catch (error) {
    console.error("Failed to update favorites:", error);
    return Response.json({ error: "Failed to update favorites" }, { status: 500 });
  }
}
