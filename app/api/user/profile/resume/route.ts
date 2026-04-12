import { Binary } from "mongodb";
import { getOptionalServerSession } from "@/lib/auth";
import { extractDocumentText } from "@/lib/document-extract";
import { UserModel, UserResumeModel } from "@/lib/models";

const MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".pdf", ".docx"];

function sanitizeUserForClient(user: Awaited<ReturnType<typeof UserModel.getUserByEmail>>) {
  if (!user) {
    return null;
  }

  const { resumeExtractedText, resumeStorageKey, ...publicUser } = user;
  return publicUser;
}

function getExtension(filename: string) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

function getContentDisposition(filename: string) {
  const escaped = filename.replaceAll('"', "\\\"");
  return `attachment; filename="${escaped}"`;
}

export async function GET() {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const resume = await UserResumeModel.getResumeByEmail(session.user.email);
    if (!resume?.data) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    const filename = resume.fileName || "resume";
    const contentType = resume.mimeType || "application/octet-stream";
    const contentDisposition = getContentDisposition(filename);
    const content = resume.data instanceof Binary ? Buffer.from(resume.data.buffer) : null;

    if (!content) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    return new Response(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Content-Length": String(content.byteLength),
      },
    });
  } catch (error) {
    console.error("Failed to load resume:", error);
    return Response.json({ error: "Failed to load resume" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
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

    const buffer = Buffer.from(await resumeField.arrayBuffer());
    const extracted = await extractDocumentText(buffer, filename);
    const uploadedAt = new Date();
    const savedResume = await UserResumeModel.upsertResume(session.user.email, {
      fileName: filename,
      mimeType: resumeField.type || "application/octet-stream",
      uploadedAt,
      data: buffer,
    });

    if (!savedResume) {
      return Response.json({ error: "Failed to save resume" }, { status: 500 });
    }

    const updatedUser = await UserModel.updateUserProfile(session.user.email, {
      resumeUrl: null,
      resumeStorageKey: null,
      resumeFileName: filename,
      resumeMimeType: resumeField.type || "application/octet-stream",
      resumeUploadedAt: uploadedAt,
      resumeExtractedText: extracted.text,
    });

    if (!updatedUser) {
      return Response.json({ error: "Failed to save resume" }, { status: 500 });
    }

    return Response.json(sanitizeUserForClient(updatedUser));
  } catch (error) {
    console.error("Failed to upload resume:", error);
    const message = error instanceof Error ? error.message : "Failed to upload resume";
    return Response.json({ error: message }, { status: 500 });
  }
}
