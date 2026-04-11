import { NextResponse } from "next/server";
import { getOptionalServerSession } from "@/lib/auth";
import { getOptionalMongoDb } from "@/lib/mongodb";

export async function GET() {
  const session = await getOptionalServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getOptionalMongoDb();
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
