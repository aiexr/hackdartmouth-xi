import { DashboardPageClient } from "@/components/app/dashboard-page-client";
import { LandingPage } from "@/components/app/landing-page";
import { getOptionalServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 25;

export default async function DashboardPage() {
  const session = await getOptionalServerSession().catch(() => null);

  if (!session) {
    return <LandingPage />;
  }

  return (
    <DashboardPageClient
      initialUser={
        session?.user
          ? {
              email: session.user.email ?? null,
              name: session.user.name ?? null,
              image: session.user.image ?? null,
            }
          : null
      }
    />
  );
}
