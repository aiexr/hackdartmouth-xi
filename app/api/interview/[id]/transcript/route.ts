import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getOptionalServerSession } from "@/lib/auth";
import { getOptionalMongoDb } from "@/lib/mongodb";

type TranscriptTurn = {
  id?: string;
  role?: string;
  content?: string;
  timestamp?: string;
  step?: number;
};

type NormalizedTranscriptTurn = {
  role: "interviewer" | "user";
  content: string;
  timestamp: string | null;
  step: number | null;
};

function normalizeTurns(turns: unknown): NormalizedTranscriptTurn[] {
  if (!Array.isArray(turns)) {
    return [];
  }

  return turns
    .map((turn) => {
      if (!turn || typeof turn !== "object") {
        return null;
      }

      const candidate = turn as TranscriptTurn;
      const role = candidate.role === "user" ? "user" : "interviewer";
      const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
      const timestamp =
        typeof candidate.timestamp === "string" ? candidate.timestamp.trim() : "";
      const step = typeof candidate.step === "number" ? candidate.step : null;

      if (!content) {
        return null;
      }

      return {
        role,
        content,
        timestamp: timestamp || null,
        step,
      };
    })
    .filter((turn): turn is NormalizedTranscriptTurn => Boolean(turn));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getOptionalServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getOptionalMongoDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid interview id" }, { status: 400 });
  }

  const body = (await req.json()) as { turns?: unknown };
  const turns = normalizeTurns(body.turns);

  if (!turns.length) {
    return NextResponse.json({ error: "No transcript turns provided" }, { status: 400 });
  }

  const result = await db.collection("interviews").updateOne(
    {
      _id: objectId,
      userId: session.user.email,
      status: { $in: ["in_progress", "in-progress"] },
    },
    {
      $push: {
        transcript: {
          $each: turns,
        },
      },
    } as any,
  );

  if (!result.matchedCount) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, appended: turns.length });
}
