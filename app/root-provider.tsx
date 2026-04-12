"use client";

import { useEffect } from "react";
import { SessionProvider } from "@/components/auth/session-provider";

export function RootProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void fetch("/api/init").catch(() => {
      // Index initialization is best-effort and should not block the app shell.
    });
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
