"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { DashboardPreview, AUTH_PREVIEW_STORAGE_KEY } from "@/components/app/dashboard-preview";
import { ThemeLogo } from "@/components/app/theme-logo";
import { cn } from "@/lib/utils";

const PREVIEW_NATURAL_WIDTH = 1460;
const PREVIEW_NATURAL_HEIGHT = 920;

export function LandingPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const popupPollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (popupPollRef.current) {
        window.clearInterval(popupPollRef.current);
      }
    };
  }, []);

  const handleGoogleSignIn = () => {
    if (isSigningIn) return;

    if (typeof window === "undefined") {
      return;
    }

    setIsSigningIn(true);

    window.sessionStorage.setItem(
      AUTH_PREVIEW_STORAGE_KEY,
      JSON.stringify({
        source: "landing",
        ts: Date.now(),
      }),
    );

    const width = 520;
    const height = 720;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

    const popup = window.open(
      "/auth/popup",
      "leetspeak-google-auth",
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      setIsSigningIn(false);
      return;
    }

    popup.focus();
    popupPollRef.current = window.setInterval(() => {
      if (!popup.closed) {
        return;
      }

      if (popupPollRef.current) {
        window.clearInterval(popupPollRef.current);
        popupPollRef.current = null;
      }

      setIsSigningIn(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background">
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-12 md:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(44rem,1.4fr)] lg:gap-14">
          <div
            className={cn(
              "relative z-10 flex max-w-xl flex-col gap-8 transition duration-500",
              isSigningIn && "translate-y-1 opacity-70",
            )}
          >
            <div className="inline-flex w-fit items-center gap-3 border border-border bg-base-100 px-4 py-3">
              <ThemeLogo alt="LeetSpeak" className="h-9 w-auto" />
              <div className="text-lg font-semibold tracking-tight">LeetSpeak</div>
            </div>

            <p className="max-w-md text-base leading-7 text-base-content/65">
              Practice behavioral, technical, and system design interviews. Get feedback on your resume and get scored after every interview to track your improvement.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-3 border border-border bg-base-100 px-5 py-3 text-sm font-medium transition hover:bg-base-200 disabled:cursor-wait disabled:opacity-80"
              >
                {isSigningIn ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
                {isSigningIn ? "Opening Google..." : "Continue with Google"}
              </button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <ScaledDashboardPreview isSigningIn={isSigningIn} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScaledDashboardPreview({ isSigningIn }: { isSigningIn: boolean }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;

    const updateScale = () => {
      const nextScale = element.clientWidth / PREVIEW_NATURAL_WIDTH;
      setScale(nextScale);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className={cn(
        "relative ml-auto w-full max-w-[70rem] overflow-hidden border border-border bg-base-100 transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isSigningIn && "scale-[1.02] -translate-x-2 blur-[0.2px]",
      )}
      style={{ aspectRatio: `${PREVIEW_NATURAL_WIDTH} / ${PREVIEW_NATURAL_HEIGHT}` }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: PREVIEW_NATURAL_WIDTH,
          height: PREVIEW_NATURAL_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <DashboardPreview className="h-full w-full" />
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
