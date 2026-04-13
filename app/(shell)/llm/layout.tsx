import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocalOrDevAccessAllowed } from "@/lib/dev-access";

export default async function LlmLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const requestHost =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host");

  if (!isLocalOrDevAccessAllowed(requestHost)) {
    notFound();
  }

  return children;
}
