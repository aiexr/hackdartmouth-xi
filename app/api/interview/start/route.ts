import { NextRequest, NextResponse } from "next/server";
import { getOptionalServerSession } from "@/lib/auth";
import { getOptionalMongoDb } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  const session = await getOptionalServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getOptionalMongoDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = (await req.json()) as {
    type?: string;
    difficulty?: string;
    scenarioId?: string | null;
  };
  const { type, difficulty, scenarioId } = body;

  const interview = {
    userId: session.user.email,
    email: session.user.email,
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
