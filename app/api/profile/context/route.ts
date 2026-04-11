import { NextRequest, NextResponse } from "next/server";
import { getOptionalServerSession } from "@/lib/auth";
import { getOptionalMongoDb } from "@/lib/mongodb";

const MAX_FIELD_LENGTH = 15_000;

function validateText(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value !== "string") return "";
  return value.slice(0, MAX_FIELD_LENGTH);
}

export async function GET() {
  const session = await getOptionalServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getOptionalMongoDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const profile = await db
    .collection("user_profiles")
    .findOne({ userId: session.user.email });

  return NextResponse.json({
    resumeText: profile?.resumeText ?? "",
    linkedinText: profile?.linkedinText ?? "",
    jobDescriptionText: profile?.jobDescriptionText ?? "",
  });
}

export async function PUT(req: NextRequest) {
  const session = await getOptionalServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getOptionalMongoDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = (await req.json()) as Record<string, unknown>;

  const update: Record<string, unknown> = { updatedAt: new Date() };

  if ("resumeText" in body) update.resumeText = validateText(body.resumeText);
  if ("linkedinText" in body) update.linkedinText = validateText(body.linkedinText);
  if ("jobDescriptionText" in body)
    update.jobDescriptionText = validateText(body.jobDescriptionText);

  await db.collection("user_profiles").updateOne(
    { userId: session.user.email },
    { $set: update },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}
