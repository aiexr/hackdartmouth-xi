import { DashboardPageClient } from "@/components/app/dashboard-page-client";
import { LandingPage } from "@/components/app/landing-page";
import { getOptionalServerSession } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";

export const dynamic = "force-dynamic";
export const maxDuration = 25;

export default async function DashboardPage() {
  const session = await getOptionalServerSession().catch(() => null);

  if (!session?.user?.email) {
    return <LandingPage />;
  }

  const metrics = await getUserInterviewMetrics(session.user.email);

  return <DashboardPageClient initialMetrics={metrics} />;
}
