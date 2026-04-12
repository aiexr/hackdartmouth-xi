import { getOptionalServerSession } from "@/lib/auth";
import { getOptionalMongoDb } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";

const MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".pdf", ".docx"];

function sanitizeUserForClient(user: Awaited<ReturnType<typeof UserModel.getUserByEmail>>) {
  if (!user) {
    return null;
  }

  const { resumeExtractedText, ...publicUser } = user;
  return {
    ...publicUser,
    hasResumeContext: Boolean(resumeExtractedText?.trim()),
  };
}

function getExtension(filename: string) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

export async function handleResumeUpload(request: Request) {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let uploadStage = "initializing request";

  try {
    const db = await getOptionalMongoDb();
    if (!db) {
      return Response.json(
        {
          error: "Resume uploads are unavailable right now",
          details: "MongoDB is not configured or could not be reached in this environment.",
        },
        { status: 503 },
      );
    }

    uploadStage = "parsing form data";
    const formData = await request.formData();
    const resumeField = formData.get("resume");

    if (!(resumeField instanceof File) || resumeField.size === 0) {
      return Response.json({ error: "Please choose a PDF or DOCX file" }, { status: 400 });
    }

    if (resumeField.size > MAX_RESUME_FILE_SIZE) {
      return Response.json({ error: "Resume exceeds 10MB limit" }, { status: 400 });
    }

    const filename = resumeField.name || "resume";
    const extension = getExtension(filename);

    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return Response.json(
        { error: "Resume must be a PDF or DOCX file" },
        { status: 400 },
      );
    }

    uploadStage = "reading upload bytes";
    const buffer = Buffer.from(await resumeField.arrayBuffer());

    uploadStage = "loading document extractor";
    const { extractDocumentText } = await import("@/lib/document-extract");

    uploadStage = "extracting document text";
    let extracted: Awaited<ReturnType<typeof extractDocumentText>>;
    try {
      extracted = await extractDocumentText(buffer, filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse resume text";
      return Response.json(
        {
          error: "Could not process this resume file",
          details: message,
        },
        { status: 400 },
      );
    }

    if (!extracted.text.trim()) {
      return Response.json(
        {
          error: "Could not process this resume file",
          details: "No readable text was found in the document.",
        },
        { status: 400 },
      );
    }

    uploadStage = "saving extracted resume text to database";
    const updatedUser = await UserModel.updateUserProfile(session.user.email, {
      resumeExtractedText: extracted.text,
    });

    if (!updatedUser) {
      return Response.json(
        {
          error: "Resume uploads are unavailable right now",
          details: "We could not save the extracted resume text for this account.",
        },
        { status: 503 },
      );
    }

    return Response.json(sanitizeUserForClient(updatedUser));
  } catch (error) {
    console.error(`Failed to upload resume at stage '${uploadStage}':`, error);
    const message = error instanceof Error ? error.message : "Failed to upload resume";
    return Response.json(
      {
        error: "Could not process this resume file",
        details: `Upload failed while ${uploadStage}: ${message}`,
      },
      { status: 500 },
    );
  }
}
