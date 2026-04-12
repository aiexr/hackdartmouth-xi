"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  AUTH_PREVIEW_STORAGE_KEY,
} from "@/components/app/dashboard-preview";

export default function AuthPopupCompletePage() {
  useEffect(() => {
    const finish = async () => {
      try {
        await fetch("/api/auth/popup-handoff", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (window.opener) {
          window.opener.sessionStorage.setItem(
            AUTH_PREVIEW_STORAGE_KEY,
            JSON.stringify({
              source: "popup",
              ts: Date.now(),
            }),
          );
          window.opener.location.href = "/";
          window.close();
          return;
        }
      } catch {
        // Fall through to same-tab redirect.
      }

      window.location.href = "/";
    };

    void finish();
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
