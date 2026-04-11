import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMongoDb } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getMongoDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { type, difficulty, scenarioId } = body;

  const interview = {
    userId: session.user.email,
    userName: session.user.name ?? "",
    type: type ?? "behavioral",
    difficulty: difficulty ?? "medium",
    scenarioId: scenarioId ?? null,
    status: "in_progress",
    transcript: [],
    overallScore: null,
    letterGrade: null,
    gradingResult: null,
    createdAt: new Date(),
    completedAt: null,
  };

  const result = await db.collection("interviews").insertOne(interview);

  return NextResponse.json({
    id: result.insertedId.toString(),
    ...interview,
  });
}
