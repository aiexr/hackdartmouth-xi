import { getOptionalServerSession } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";

export async function GET() {
  const session = await getOptionalServerSession().catch(() => null);
  const email = session?.user?.email;

  if (!email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metrics = await getUserInterviewMetrics(email).catch(() =>
    getUserInterviewMetrics(),
  );

  return Response.json(metrics, {
    headers: {
      "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
    },
  });
}
