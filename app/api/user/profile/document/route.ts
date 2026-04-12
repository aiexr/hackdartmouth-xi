import { handleResumeUpload } from "@/lib/resume-upload";

export async function POST(request: Request) {
  return handleResumeUpload(request);
}
