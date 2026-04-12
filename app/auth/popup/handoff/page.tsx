"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_PREVIEW_GEOMETRY_KEY,
  PREVIEW_NATURAL_HEIGHT,
  PREVIEW_NATURAL_WIDTH,
  ScaledDashboardPreview,
} from "@/components/app/dashboard-preview";

type PreviewGeometry = {
  top: number;
  left: number;
  width: number;
  height: number;
  theme?: string | null;
};

const ANIMATION_DURATION_MS = 1080;
const ANIMATION_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function AuthPopupHandoffPage() {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [geometry, setGeometry] = useState<PreviewGeometry | null>(null);

  useLayoutEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(AUTH_PREVIEW_GEOMETRY_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as PreviewGeometry;
      if (
        typeof parsed.top === "number" &&
        typeof parsed.left === "number" &&
        typeof parsed.width === "number" &&
        typeof parsed.height === "number"
      ) {
        if (typeof parsed.theme === "string" && parsed.theme) {
          document.documentElement.setAttribute("data-theme", parsed.theme);
        }
        setGeometry(parsed);
      }
    } catch {
      // Ignore malformed geometry and fall back to a default preview frame.
    }
  }, []);

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;

    const compact = getCompactStyle(geometry);
    const expanded = getExpandedStyle();
    let cancelled = false;
    let animation: Animation | null = null;

    const startAnimation = window.setTimeout(() => {
      if (cancelled) return;

      animation = element.animate(
        [
          {
            top: px(compact.top),
            left: px(compact.left),
            width: px(compact.width),
            height: px(compact.height),
          },
          {
            top: px(expanded.top),
            left: px(expanded.left),
            width: px(expanded.width),
            height: px(expanded.height),
          },
        ],
        {
          duration: ANIMATION_DURATION_MS,
          easing: ANIMATION_EASING,
          fill: "forwards",
        },
      );

      void animation.finished.finally(() => {
        if (cancelled) return;
        window.sessionStorage.removeItem(AUTH_PREVIEW_GEOMETRY_KEY);
        router.replace("/");
      });
    }, 28);

    return () => {
      cancelled = true;
      window.clearTimeout(startAnimation);
      animation?.cancel();
    };
  }, [geometry, router]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <ScaledDashboardPreview
        frameRef={previewRef}
        className="ml-0 max-w-none"
        outerStyle={{
          position: "fixed",
          overflow: "hidden",
          ...getCompactStyle(geometry),
        }}
      />
    </div>
  );
}

function getCompactStyle(geometry: PreviewGeometry | null) {
  if (geometry) {
    return {
      top: geometry.top,
      left: geometry.left,
      width: geometry.width,
      height: geometry.height,
    };
  }

  if (typeof window === "undefined") {
    return {
      top: 96,
      left: 760,
      width: 960,
      height: (960 * PREVIEW_NATURAL_HEIGHT) / PREVIEW_NATURAL_WIDTH,
    };
  }

  const width = Math.min(window.innerWidth * 0.44, 1120);

  return {
    top: window.innerHeight * 0.12,
    left: window.innerWidth * 0.52,
    width,
    height: (width * PREVIEW_NATURAL_HEIGHT) / PREVIEW_NATURAL_WIDTH,
  };
}

function getExpandedStyle() {
  return {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function px(value: number) {
  return `${value}px`;
}
