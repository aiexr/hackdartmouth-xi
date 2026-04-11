import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
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
  const { interviewId, transcript } = body;

  if (!interviewId) {
    return NextResponse.json({ error: "interviewId required" }, { status: 400 });
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(interviewId);
  } catch {
    return NextResponse.json({ error: "Invalid interviewId" }, { status: 400 });
  }

  const interview = await db.collection("interviews").findOne({
    _id: objectId,
    userId: session.user.email,
  });

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  await db.collection("interviews").updateOne(
    { _id: objectId },
    {
      $set: {
        status: "completed",
        transcript: transcript ?? [],
        completedAt: new Date(),
      },
    },
  );

  return NextResponse.json({ ok: true, id: interviewId });
}
