import { MainShell } from "@/components/app/main-shell";
import { SessionProvider } from "@/components/auth/session-provider";
import { ResumeUploadProvider } from "@/components/app/resume-upload-provider";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ResumeUploadProvider>
        <MainShell>{children}</MainShell>
      </ResumeUploadProvider>
    </SessionProvider>
  );
}
