"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthPopupCompletePage() {
  useEffect(() => {
    try {
      if (window.opener) {
        window.opener.location.href = "/auth/popup/handoff";
        window.close();
        return;
      }
    } catch {
      // Fall through to same-tab redirect.
    }

    window.location.href = "/auth/popup/handoff";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex items-center gap-3 border border-border bg-base-100 px-5 py-4 text-sm font-medium text-base-content">
        <Loader2 className="size-4 animate-spin" />
        Finishing sign-in...
      </div>
    </div>
  );
}
