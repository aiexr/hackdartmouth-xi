"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function AuthPopupPage() {
  useEffect(() => {
    void signIn("google", { callbackUrl: "/auth/popup/complete" });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex items-center gap-3 border border-border bg-base-100 px-5 py-4 text-sm font-medium text-base-content">
        <Loader2 className="size-4 animate-spin" />
        Redirecting to Google...
      </div>
    </div>
  );
}
