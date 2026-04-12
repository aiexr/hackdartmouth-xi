import { NextResponse } from "next/server";

const LC_GRAPHQL = "https://leetcode.com/graphql/";

const QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionFrontendId
      title
      titleSlug
      difficulty
      content
      hints
      topicTags {
        name
      }
      exampleTestcaseList
    }
  }
`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const res = await fetch(LC_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ query: QUERY, variables: { titleSlug: slug } }),
      next: { revalidate: 86400 },
    });

    const data = await res.json() as { data?: { question?: unknown } };
    const question = data?.data?.question;
    if (!question) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
