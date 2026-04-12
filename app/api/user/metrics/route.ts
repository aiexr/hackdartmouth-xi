import { getOptionalServerSession } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";

export async function GET() {
  const session = await getOptionalServerSession();

  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const metrics = await getUserInterviewMetrics(session.user.email);
    return Response.json(metrics);
  } catch (error) {
    console.error("Failed to fetch user metrics:", error);
    return Response.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
