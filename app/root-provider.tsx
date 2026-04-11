"use client";

import { SessionProvider } from "@/components/auth/session-provider";
import { useInitializeDatabase } from "@/lib/hooks/useInitializeDatabase";

export function RootProvider({ children }: { children: React.ReactNode }) {
  useInitializeDatabase();

  return <SessionProvider>{children}</SessionProvider>;
}
