import { MainShell } from "@/components/app/main-shell";
import { ResumeUploadProvider } from "@/components/app/resume-upload-provider";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResumeUploadProvider>
      <MainShell>{children}</MainShell>
    </ResumeUploadProvider>
  );
}
