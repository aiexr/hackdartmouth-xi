import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getOptionalServerSession } from "@/lib/auth";
import { sanitizeFeedbackItems } from "@/lib/grading-feedback";
import { getOptionalMongoDb } from "@/lib/mongodb";
import { UserModel } from "@/lib/models";
import { ll } from "@/lib/integrations/llm";

const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_DARTMOUTH_VISION_MODEL = "qwen.qwen3-vl-32b-instruct-fp8";

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
  diagram_analysis?: {
    description: string;
    strengths: string[];
    improvements: string[];
    key_points: string[];
  };
  model_used?: string;
  generated_at?: string;
};

type UploadedDocument = {
  buffer: Buffer;
  mimeType: string;
  filename: string;
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

async function extractUploadedDocumentContext(document: UploadedDocument) {
  const { extractDocumentText, formatDocumentContextForPrompt } = await import(
    "@/lib/document-extract"
  );
  const extracted = await extractDocumentText(document.buffer, document.filename);
  return formatDocumentContextForPrompt(extracted);
}

function normalizeGradingResult(raw: unknown): NormalizedGradingResult {
  const payload = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const overallRaw =
    typeof payload.overall_score === "number"
      ? payload.overall_score
      : typeof payload.overallScore === "number"
        ? payload.overallScore
        : null;

  if (typeof overallRaw !== "number" || !Number.isFinite(overallRaw)) {
    throw new Error("Grading model returned no overall score.");
  }

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
          if (typeof dimension.score !== "number" || !Number.isFinite(dimension.score)) {
            return null;
          }
          const score = clamp(Math.round(dimension.score), 1, 100);
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
          if (typeof question.score !== "number" || !Number.isFinite(question.score)) {
            return null;
          }
          return {
            question:
              typeof question.question === "string"
                ? question.question
                : "Interview question",
            answer_summary:
              typeof question.answer_summary === "string"
                ? question.answer_summary
                : "Summary unavailable.",
            score: clamp(Math.round(question.score), 1, 100),
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

  const strengths = sanitizeFeedbackItems(payload.strengths);

  const improvements = sanitizeFeedbackItems(payload.improvements);

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

  // Diagram analysis (optional; present for system-design interviews)
  const diagramAnalysisRaw = payload.diagram_analysis ?? payload.diagramAnalysis;
  const diagram_analysis =
    diagramAnalysisRaw && typeof diagramAnalysisRaw === "object"
      ? ((): { description: string; strengths: string[]; improvements: string[]; key_points: string[] } => {
          const d = diagramAnalysisRaw as Record<string, unknown>;
          const description = typeof d.description === "string" ? d.description : "";
          const strengthsArr = sanitizeFeedbackItems(d.strengths);
          const improvementsArr = sanitizeFeedbackItems(d.improvements);
          const keyPointsArr = Array.isArray(d.key_points)
            ? d.key_points.filter((it): it is string => typeof it === "string")
            : [];

          return {
            description,
            strengths: strengthsArr,
            improvements: improvementsArr,
            key_points: keyPointsArr,
          };
        })()
      : undefined;

  return {
    overall_score: overallScore,
    letter_grade: letterGrade,
    dimensions,
    per_question: perQuestion,
    strengths,
    improvements,
    key_moments: keyMoments,
    diagram_analysis,
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
    diagramSnapshot?: string;
    editorContent?: string;
  } = {
    interviewId: undefined,
    transcript: undefined,
    diagramSnapshot: undefined,
    editorContent: undefined,
  };
  let diagramSnapshotString: string | null = null;
  let documentError: string | null = null;
  let uploadedDocument: UploadedDocument | null = null;

  // Parse request: support both JSON and FormData
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const interviewIdField = formData.get("interviewId");
      const transcriptField = formData.get("transcript");
      const documentFile = formData.get("document") as File | null;
      const diagramField = formData.get("diagramSnapshot");

      body.interviewId =
        typeof interviewIdField === "string" ? interviewIdField : undefined;
      body.transcript =
        typeof transcriptField === "string"
          ? JSON.parse(transcriptField)
          : undefined;

      if (typeof diagramField === "string" && diagramField.trim()) {
        diagramSnapshotString = diagramField.trim();
        body.diagramSnapshot = diagramSnapshotString;
      }

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
    const jsonBody = (await req.json()) as Record<string, unknown>;
    body = jsonBody as typeof body;
    if (typeof jsonBody?.diagramSnapshot === "string" && jsonBody.diagramSnapshot.trim()) {
      diagramSnapshotString = jsonBody.diagramSnapshot.trim();
    }
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
  const profile = await UserModel.getUserByEmail(session.user.email);
  const resumeContext = profile?.resumeExtractedText?.trim()
    ? profile.resumeExtractedText.trim().slice(0, 8000)
    : "";

  // If a diagram snapshot (data URL) was provided, parse it into an image payload
  let diagramImage: { mimeType: string; dataBase64: string } | undefined;
  if (diagramSnapshotString) {
    const match = diagramSnapshotString.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mimeType = String(match[1]).trim();
      const dataBase64 = String(match[2]).trim();
      if (mimeType.startsWith("image/") && dataBase64.length > 0) {
        // Optional: enforce size limit on decoded bytes
        try {
          const byteLen = Buffer.byteLength(dataBase64, "base64");
          if (byteLen > 10 * 1024 * 1024) {
            // ignore overly large images
            diagramImage = undefined;
          } else {
            diagramImage = { mimeType, dataBase64 };
          }
        } catch {
          diagramImage = undefined;
        }
      }
    }
  }

  let gradingResult: NormalizedGradingResult | null = null;
  let gradingError: string | null = null;

  if (transcriptText) {
    const systemPrompt =
      "You are a senior interview coach. Grade interview performance with strict, constructive, and fair feedback. Return only valid JSON.";

    // If a whiteboard diagram is attached, make the system prompt explicit about using it.
    // Important: always ask the model to return valid JSON. If the image bytes are unreadable,
    // instruct the model to include a top-level boolean `image_unreadable: true` and keep
    // `diagram_analysis` set to null rather than returning raw text like IMAGE_UNREADABLE.
    const effectiveSystemPrompt = diagramImage
      ? [
          systemPrompt,
          "",
          "A whiteboard diagram image is attached to this request. Use it as a primary source of truth when evaluating the candidate's system-design reasoning.",
          "Do not claim that you cannot view images.",
          'If image bytes are unreadable, still return valid JSON. Set a top-level boolean field "image_unreadable": true and set "diagram_analysis": null. Do NOT output raw non-JSON text like IMAGE_UNREADABLE.',
        ].join("\n")
      : systemPrompt;

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

    // If this is a system-design interview, request an explicit diagram_analysis section
    try {
      if (String(interview.type ?? "").toLowerCase() === "system-design") {
        const closingIndex = promptParts.findIndex((line) => line === "}");
        if (closingIndex !== -1) {
          promptParts.splice(
            closingIndex,
            0,
            '  "diagram_analysis": {',
            '    "description": string,',
            '    "strengths": string[],',
            '    "improvements": string[],',
            '    "key_points": string[]',
            '  },',
            '  "image_unreadable": boolean,'
          );
        }
      }
    } catch {
      // no-op; keep original promptParts on error
    }

    if (resumeContext) {
      promptParts.splice(
        promptParts.length - 1,
        0,
        "Candidate resume:",
        resumeContext,
        "",
      );
    }

    if (uploadedDocument) {
      try {
        promptParts.push("", await extractUploadedDocumentContext(uploadedDocument), "");
      } catch (error) {
        documentError =
          error instanceof Error ? error.message : "Document extraction failed";
      }
    }

    promptParts.push("Transcript:");
    promptParts.push(transcriptText);

    const userPrompt = promptParts.join("\n");

    const gradeInterview = async (image?: { mimeType: string; dataBase64: string }) => {
      const autoSelectVision = Boolean(image);
      const llmResponse = await ll(userPrompt, {
        systemPrompt: autoSelectVision ? effectiveSystemPrompt : systemPrompt,
        parseJson: true,
        temperature: 0.2,
        maxTokens: 3000,
        modelOverride: autoSelectVision ? DEFAULT_DARTMOUTH_VISION_MODEL : undefined,
        image,
        providerOverride: autoSelectVision ? "openai" : undefined,
      });

      const result = normalizeGradingResult(llmResponse.json);
      result.model_used = llmResponse.modelUsed;
      result.generated_at = new Date().toISOString();
      return result;
    };

    try {
      gradingResult = await gradeInterview(diagramImage);
    } catch (error) {
      const primaryError = error instanceof Error ? error.message : String(error);
      console.error("Interview grading attempt failed.", {
        interviewId,
        scenarioId: String(interview.scenarioId ?? "unknown"),
        interviewType: String(interview.type ?? "unknown"),
        difficulty: String(interview.difficulty ?? "unknown"),
        userEmail: session.user.email,
        hasTranscript: Boolean(transcriptText),
        transcriptChars: transcriptText.length,
        hasResumeContext: Boolean(resumeContext),
        resumeChars: resumeContext.length,
        hasDiagram: Boolean(diagramImage),
        hasUploadedDocument: Boolean(uploadedDocument),
        providerOverride: diagramImage ? "openai" : process.env.LLM_PROVIDER ?? "openai",
        modelOverride: diagramImage ? DEFAULT_DARTMOUTH_VISION_MODEL : null,
        error: primaryError,
      });

      if (diagramImage) {
        try {
          gradingResult = await gradeInterview();
        } catch (retryError) {
          const retryMessage =
            retryError instanceof Error ? retryError.message : String(retryError);
          console.error("Interview grading retry without diagram failed.", {
            interviewId,
            scenarioId: String(interview.scenarioId ?? "unknown"),
            userEmail: session.user.email,
            transcriptChars: transcriptText.length,
            hasUploadedDocument: Boolean(uploadedDocument),
            providerOverride: process.env.LLM_PROVIDER ?? "openai",
            retryError: retryMessage,
          });
          gradingError = `${primaryError} Retry without diagram also failed: ${retryMessage}`;
        }
      } else {
        gradingError = primaryError;
      }
    }
  }

  await db.collection("interviews").updateOne(
    { _id: objectId },
    {
      $set: {
        status: "completed",
        transcript: transcript ?? [],
        completedAt: new Date(),
        diagramSnapshot: diagramSnapshotString ?? null,
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
