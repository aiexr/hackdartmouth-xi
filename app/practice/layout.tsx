import { SessionProvider } from "@/components/auth/session-provider";
import { getOptionalServerSession } from "@/lib/auth";

export default async function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOptionalServerSession().catch(() => null);

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
