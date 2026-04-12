import { NextResponse } from "next/server";

const LC_GRAPHQL = "https://leetcode.com/graphql/";

const QUERY = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total: totalNum
      questions: data {
        frontendQuestionId: questionFrontendId
        title
        titleSlug
        difficulty
        paidOnly: isPaidOnly
        topicTags {
          name
        }
      }
    }
  }
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get("difficulty") ?? "";
  const skip = Number(searchParams.get("skip") ?? "0");
  const limit = Number(searchParams.get("limit") ?? "50");

  const filters: Record<string, string> = {};
  if (difficulty && difficulty !== "All") {
    filters.difficulty = difficulty.toUpperCase();
  }

  try {
    const res = await fetch(LC_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { categorySlug: "algorithms", limit, skip, filters },
      }),
      next: { revalidate: 3600 },
    });

    const data = await res.json() as { data?: { problemsetQuestionList?: { total: number; questions: unknown[] } } };
    const list = data?.data?.problemsetQuestionList;
    if (!list) throw new Error("Unexpected response shape");

    return NextResponse.json({ total: list.total, questions: list.questions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
