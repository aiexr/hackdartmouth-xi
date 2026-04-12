import { getOptionalServerSession } from "@/lib/auth";
import { handleResumeUpload } from "@/lib/resume-upload";

export async function GET() {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  return Response.json(
    {
      error: "Resume file downloads are no longer available",
      details: "Resumes are processed into text and stored in MongoDB for interview context only.",
    },
    { status: 410 },
  );
}

export async function POST(request: Request) {
  return handleResumeUpload(request);
}
