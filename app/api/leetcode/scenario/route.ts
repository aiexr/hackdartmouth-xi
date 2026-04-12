import { NextResponse } from "next/server";
import { ll } from "@/lib/integrations/llm";

export async function POST(request: Request) {
  const { title, description, difficulty, topicTags } = await request.json() as {
    title: string;
    description: string;
    difficulty: string;
    topicTags: string[];
  };

  const prompt = `You are preparing a live technical mock-interview session for the LeetCode problem "${title}" (${difficulty} difficulty).

Topic tags: ${topicTags?.join(", ") ?? "N/A"}

Problem description (plain text):
${description.slice(0, 3000)}

Generate interview scaffolding as JSON with exactly these keys:
{
  "optimalApproach": "2-3 sentences describing the optimal solution and its time/space complexity",
  "starterCode": "A TypeScript function stub with correct parameter names and types based on the problem, with a single-line comment inside",
  "functionName": "camelCase name of the main function",
  "hints": ["4 interview coaching hints about how to think aloud and approach this problem during an interview"],
  "rubric": ["5 grading criteria specific to this problem"],
  "followUps": ["2 follow-up questions an interviewer would ask after a correct solution"]
}

Return ONLY valid JSON. No markdown. No extra text.`;

  try {
    const result = await ll(prompt, {
      parseJson: true,
      temperature: 0.3,
      maxTokens: 1200,
      systemPrompt: "You are a senior software engineer generating mock interview scaffolding. Return only valid JSON.",
    });

    return NextResponse.json(result.json);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
