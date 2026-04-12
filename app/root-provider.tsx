"use client";

import { SessionProvider } from "@/components/auth/session-provider";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
