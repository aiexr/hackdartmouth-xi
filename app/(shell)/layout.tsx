import { MainShell } from "@/components/app/main-shell";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainShell>{children}</MainShell>;
}
