import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getOptionalServerSession } from "@/lib/auth";
import { getOptionalMongoDb } from "@/lib/mongodb";
import { ll } from "@/lib/integrations/llm";

const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024;

type NormalizedGradingResult = {
  overall_score: number;
  letter_grade: string;
  dimensions: Array<{ name: string; score: number; feedback: string }>;
  per_question: Array<{
    question: string;
    answer_summary: string;
    score: number;
    feedback: string;
  }>;
  strengths: string[];
  improvements: string[];
  key_moments: Array<{
    timestamp: string;
    type: "strength" | "improvement" | "note";
    description: string;
  }>;
  model_used?: string;
  generated_at?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toLetterGrade(score: number) {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

function transcriptToText(transcript: unknown) {
  if (typeof transcript === "string") {
    return transcript.trim();
  }

  if (!Array.isArray(transcript)) {
    return "";
  }

  return transcript
    .map((item, index) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (!item || typeof item !== "object") {
        return "";
      }

      const turn = item as Record<string, unknown>;
      const role = typeof turn.role === "string" ? turn.role : "speaker";
      const content = typeof turn.content === "string" ? turn.content : "";
      const timestamp =
        typeof turn.timestamp === "string" || typeof turn.timestamp === "number"
          ? ` [${String(turn.timestamp)}]`
          : "";

      if (!content.trim()) {
        return "";
      }

      return `Turn ${index + 1}${timestamp} - ${role}: ${content.trim()}`;
    })
    .filter(Boolean)
    .join("\n");
}

function normalizeGradingResult(raw: unknown): NormalizedGradingResult {
  const payload = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const overallRaw =
    typeof payload.overall_score === "number"
      ? payload.overall_score
      : typeof payload.overallScore === "number"
        ? payload.overallScore
        : 70;

  const overallScore = clamp(Math.round(overallRaw), 1, 100);

  const letterGrade =
    typeof payload.letter_grade === "string"
      ? payload.letter_grade
      : typeof payload.letterGrade === "string"
        ? payload.letterGrade
        : toLetterGrade(overallScore);

  const dimensions = Array.isArray(payload.dimensions)
    ? payload.dimensions
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const dimension = item as Record<string, unknown>;
          const name = typeof dimension.name === "string" ? dimension.name : "Dimension";
          const score =
            typeof dimension.score === "number"
              ? clamp(Math.round(dimension.score), 1, 100)
              : 70;
          const feedback =
            typeof dimension.feedback === "string" ? dimension.feedback : "No feedback provided.";
          return { name, score, feedback };
        })
        .filter((item): item is { name: string; score: number; feedback: string } =>
          Boolean(item),
        )
    : [];

  const perQuestion = Array.isArray(payload.per_question)
    ? payload.per_question
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const question = item as Record<string, unknown>;
          return {
            question:
              typeof question.question === "string"
                ? question.question
                : "Interview question",
            answer_summary:
              typeof question.answer_summary === "string"
                ? question.answer_summary
                : "Summary unavailable.",
            score:
              typeof question.score === "number"
                ? clamp(Math.round(question.score), 1, 100)
                : 70,
            feedback:
              typeof question.feedback === "string"
                ? question.feedback
                : "No feedback provided.",
          };
        })
        .filter(
          (
            item,
          ): item is {
            question: string;
            answer_summary: string;
            score: number;
            feedback: string;
          } => Boolean(item),
        )
    : [];

  const strengths = Array.isArray(payload.strengths)
    ? payload.strengths.filter((item): item is string => typeof item === "string")
    : [];

  const improvements = Array.isArray(payload.improvements)
    ? payload.improvements.filter((item): item is string => typeof item === "string")
    : [];

  const keyMoments = Array.isArray(payload.key_moments)
    ? payload.key_moments
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const moment = item as Record<string, unknown>;
          const typeValue = typeof moment.type === "string" ? moment.type : "note";
          const type =
            typeValue === "strength" || typeValue === "improvement" ? typeValue : "note";
          return {
            timestamp:
              typeof moment.timestamp === "string" ? moment.timestamp : "unknown",
            type,
            description:
              typeof moment.description === "string"
                ? moment.description
                : "No description provided.",
          };
        })
        .filter(
          (
            item,
          ): item is {
            timestamp: string;
            type: "strength" | "improvement" | "note";
            description: string;
          } => Boolean(item),
        )
    : [];

  return {
    overall_score: overallScore,
    letter_grade: letterGrade,
    dimensions,
    per_question: perQuestion,
    strengths,
    improvements,
    key_moments: keyMoments,
  };
}

export async function POST(req: NextRequest) {
  const session = await getOptionalServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getOptionalMongoDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: {
    interviewId?: string;
    transcript?: unknown;
  } = {
    interviewId: undefined,
    transcript: undefined,
  };
  let documentError: string | null = null;
  let uploadedDocument: { buffer: Buffer; mimeType: string; filename: string } | null = null;

  // Parse request: support both JSON and FormData
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const interviewIdField = formData.get("interviewId");
      const transcriptField = formData.get("transcript");
      const documentFile = formData.get("document") as File | null;

      body.interviewId =
        typeof interviewIdField === "string" ? interviewIdField : undefined;
      body.transcript =
        typeof transcriptField === "string"
          ? JSON.parse(transcriptField)
          : undefined;

      // Extract document if present
      if (documentFile && documentFile.size > 0) {
        if (documentFile.size > MAX_DOCUMENT_FILE_SIZE) {
          return NextResponse.json(
            { error: "Document exceeds 10MB limit" },
            { status: 400 },
          );
        }

        try {
          const buffer = Buffer.from(await documentFile.arrayBuffer());
          uploadedDocument = {
            buffer,
            filename: documentFile.name,
            mimeType: documentFile.type || "application/octet-stream",
          };
        } catch (error) {
          documentError =
            error instanceof Error ? error.message : "Document extraction failed";
        }
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid form data",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 },
      );
    }
  } else {
    // Parse as JSON (backward compatibility)
    body = (await req.json()) as typeof body;
  }

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

  const transcriptText = transcriptToText(transcript ?? []);

  let gradingResult: NormalizedGradingResult | null = null;
  let gradingError: string | null = null;

  if (transcriptText) {
    const systemPrompt =
      "You are a senior interview coach. Grade interview performance with strict, constructive, and fair feedback. Return only valid JSON.";

    const promptParts = [
      "Evaluate this mock interview and return a JSON object with this exact schema:",
      "{",
      '  "overall_score": number (1-100),',
      '  "letter_grade": string (A+ to F),',
      '  "dimensions": [{ "name": string, "score": number (1-100), "feedback": string }],',
      '  "per_question": [{ "question": string, "answer_summary": string, "score": number (1-100), "feedback": string }],',
      '  "strengths": string[],',
      '  "improvements": string[],',
      '  "key_moments": [{ "timestamp": string, "type": "strength" | "improvement" | "note", "description": string }]',
      "}",
      "",
      "Scoring guidance:",
      "- Evaluate correctness, reasoning, communication clarity, and structure.",
      "- Be specific and evidence-based from the transcript.",
      "- Keep strengths and improvements concise and actionable.",
      "",
      "Interview metadata:",
      `- Type: ${String(interview.type ?? "behavioral")}`,
      `- Difficulty: ${String(interview.difficulty ?? "medium")}`,
      `- Scenario ID: ${String(interview.scenarioId ?? "unknown")}`,
      "",
    ];

    promptParts.push("Transcript:");
    promptParts.push(transcriptText);

    const userPrompt = promptParts.join("\n");

    try {
      const llmResponse = await ll(userPrompt, {
        systemPrompt,
        parseJson: true,
        temperature: 0.2,
        maxTokens: 3000,
        document: uploadedDocument
          ? {
              mimeType: uploadedDocument.mimeType,
              filename: uploadedDocument.filename,
              buffer: uploadedDocument.buffer,
            }
          : undefined,
      });

      gradingResult = normalizeGradingResult(llmResponse.json);
      gradingResult.model_used = llmResponse.modelUsed;
      gradingResult.generated_at = new Date().toISOString();
    } catch (error) {
      gradingError = error instanceof Error ? error.message : String(error);
    }
  }

  await db.collection("interviews").updateOne(
    { _id: objectId },
    {
      $set: {
        status: "completed",
        transcript: transcript ?? [],
        completedAt: new Date(),
        overallScore: gradingResult?.overall_score ?? null,
        letterGrade: gradingResult?.letter_grade ?? null,
        gradingResult,
        gradingError,
      },
    },
  );

  return NextResponse.json({
    ok: true,
    id: interviewId,
    graded: Boolean(gradingResult),
    gradingError,
    documentProcessed: Boolean(uploadedDocument),
    documentError,
  });
}
