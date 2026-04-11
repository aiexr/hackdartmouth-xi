import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMongoDb } from "@/lib/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getMongoDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const interviews = await db
    .collection("interviews")
    .find({ userId: session.user.email })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(interviews);
}
