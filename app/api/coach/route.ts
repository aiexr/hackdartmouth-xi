import { getOptionalServerSession } from "@/lib/auth";
import { UserModel } from "@/lib/models";
import { ll } from "@/lib/integrations/llm";

const COACH_SYSTEM_PROMPT = `You are a senior interview coach. You give specific, actionable feedback on resumes and interview preparation.

Rules:
- Be direct and concrete. No generic advice.
- When reviewing a resume, call out specific lines or sections that are weak and explain why.
- Suggest rewrites, not just criticism.
- Keep responses focused and under 300 words unless the user asks for more detail.
- If the user has no resume uploaded, tell them to upload one on their Profile page first.`;

export async function POST(request: Request) {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { message: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.message && !body.action) {
    return Response.json({ error: "Message or action required" }, { status: 400 });
  }

  try {
    const user = await UserModel.getUserByEmail(session.user.email);
    const resumeText = user?.resumeExtractedText?.trim() || null;

    let prompt: string;

    if (body.action === "resume-review") {
      if (!resumeText) {
        return Response.json({
          reply:
            "I don't see a resume on your profile yet. Head to your Profile page and upload a PDF or DOCX first, then come back and I'll review it.",
        });
      }

      prompt = `The user wants a resume review. Here is their resume text:\n\n---\n${resumeText}\n---\n\nGive a thorough review: identify the strongest parts, the weakest parts, and give 3-5 specific rewrite suggestions for the weakest lines. Be concrete — quote the original text and show the improved version.`;
    } else {
      const contextBlock = resumeText
        ? `\n\nFor context, here is the user's resume:\n---\n${resumeText}\n---\n`
        : "";

      prompt = `${body.message}${contextBlock}`;
    }

    const result = await ll(prompt, {
      systemPrompt: COACH_SYSTEM_PROMPT,
      temperature: 0.4,
      maxTokens: 2000,
    });

    return Response.json({ reply: result.content });
  } catch (error) {
    console.error("Coach API error:", error);
    const message = error instanceof Error ? error.message : "Coach request failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
