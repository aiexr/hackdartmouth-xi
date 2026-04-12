import { cookies } from "next/headers";
import { MainShell } from "@/components/app/main-shell";
import { ResumeUploadProvider } from "@/components/app/resume-upload-provider";
import { AUTH_PREVIEW_COOKIE } from "@/components/app/dashboard-preview";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialAuthIntro = cookieStore.get(AUTH_PREVIEW_COOKIE)?.value === "1";

  return (
    <ResumeUploadProvider>
      <MainShell initialAuthIntro={initialAuthIntro}>{children}</MainShell>
    </ResumeUploadProvider>
  );
}
