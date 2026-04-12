import { getOptionalServerSession } from "@/lib/auth";
import { MainShell } from "@/components/app/main-shell";
import { SessionProvider } from "@/components/auth/session-provider";
import { ResumeUploadProvider } from "@/components/app/resume-upload-provider";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOptionalServerSession().catch(() => null);

  return (
    <SessionProvider session={session}>
      <ResumeUploadProvider>
        <MainShell>{children}</MainShell>
      </ResumeUploadProvider>
    </SessionProvider>
  );
}
