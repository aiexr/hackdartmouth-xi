import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalServerSession } from "@/lib/auth";
import { extractDocumentText } from "@/lib/document-extract";
import { UserModel } from "@/lib/models";

const MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".pdf", ".docx"];

type ResumeCloudflareEnv = CloudflareEnv & {
  RESUME_BUCKET?: NonNullable<CloudflareEnv["NEXT_INC_CACHE_R2_BUCKET"]>;
};

function sanitizeUserForClient(user: Awaited<ReturnType<typeof UserModel.getUserByEmail>>) {
  if (!user) {
    return null;
  }

  const { resumeExtractedText, resumeStorageKey, ...publicUser } = user;
  return publicUser;
}

function getResumeStorageKey(email: string) {
  return `users/${encodeURIComponent(email.toLowerCase())}/resume`;
}

function getExtension(filename: string) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

function getContentDisposition(filename: string) {
  const escaped = filename.replaceAll('"', "\\\"");
  return `attachment; filename="${escaped}"`;
}

function getBucket(env: ResumeCloudflareEnv) {
  const bucket = env.RESUME_BUCKET;

  if (!bucket) {
    throw new Error("Resume storage bucket is not configured");
  }

  return bucket;
}

export async function GET() {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await UserModel.getUserByEmail(session.user.email);
    if (!user?.resumeStorageKey) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const bucket = getBucket(env as ResumeCloudflareEnv);
    const stored = await bucket.get(user.resumeStorageKey);

    if (!stored?.body) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    const filename = stored.customMetadata?.filename || user.resumeFileName || "resume";
    const contentType = stored.httpMetadata?.contentType || user.resumeMimeType || "application/octet-stream";
    const contentDisposition =
      stored.httpMetadata?.contentDisposition || getContentDisposition(filename);

    return new Response(stored.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Content-Length": String(stored.size),
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

    const { env } = await getCloudflareContext({ async: true });
    const bucket = getBucket(env as ResumeCloudflareEnv);
    const storageKey = getResumeStorageKey(session.user.email);
    const uploadedAt = new Date();

    await bucket.put(storageKey, buffer, {
      httpMetadata: {
        contentType: resumeField.type || "application/octet-stream",
        contentDisposition: getContentDisposition(filename),
      },
      customMetadata: {
        filename,
        uploadedAt: uploadedAt.toISOString(),
      },
    });

    const updatedUser = await UserModel.updateUserProfile(session.user.email, {
      resumeStorageKey: storageKey,
      resumeFileName: filename,
      resumeMimeType: resumeField.type || "application/octet-stream",
      resumeUploadedAt: uploadedAt,
      resumeExtractedText: extracted.text,
    });

    if (!updatedUser) {
      let cleanupError: string | null = null;

      try {
        await bucket.delete(storageKey);
      } catch (deleteError) {
        cleanupError = deleteError instanceof Error ? deleteError.message : "Failed to clean up uploaded file";
        console.error("Failed to clean up uploaded resume after profile save failure:", deleteError);
      }

      if (cleanupError) {
        return Response.json(
          {
            error: "Failed to save resume",
            cleanupError,
          },
          { status: 500 },
        );
      }

      return Response.json({ error: "Failed to save resume" }, { status: 500 });
    }

    return Response.json(sanitizeUserForClient(updatedUser));
  } catch (error) {
    console.error("Failed to upload resume:", error);
    const message = error instanceof Error ? error.message : "Failed to upload resume";
    return Response.json({ error: message }, { status: 500 });
  }
}