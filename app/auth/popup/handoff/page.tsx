"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_PREVIEW_GEOMETRY_KEY,
  ScaledDashboardPreview,
} from "@/components/app/dashboard-preview";

type PreviewGeometry = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export default function AuthPopupHandoffPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"compact" | "expanded">("compact");
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
        setGeometry(parsed);
      }
    } catch {
      // Ignore malformed geometry and fall back to computed values.
    }
  }, []);

  useLayoutEffect(() => {
    let frame = 0;

    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => {
        setStage("expanded");
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.sessionStorage.removeItem(AUTH_PREVIEW_GEOMETRY_KEY);
      router.replace("/");
      router.refresh();
    }, 920);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <div
        className="absolute overflow-hidden transition-[top,left,width,height,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={getHandoffStyle(stage, geometry)}
      >
        <ScaledDashboardPreview className="max-w-none" />
      </div>
    </div>
  );
}

function getHandoffStyle(
  stage: "compact" | "expanded",
  geometry: PreviewGeometry | null,
) {
  if (stage === "expanded") {
    return {
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      transform: "scale(1)",
    };
  }

  if (typeof window === "undefined") {
    return {
      top: "12vh",
      left: "52vw",
      width: "44vw",
      height: "auto",
      aspectRatio: "1460 / 920",
      transform: "scale(1)",
    };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (geometry) {
    return {
      top: geometry.top,
      left: geometry.left,
      width: geometry.width,
      height: geometry.height,
      transform: "scale(1)",
    };
  }

  if (viewportWidth < 1024) {
    return {
      top: Math.max(24, viewportHeight * 0.22),
      left: 24,
      width: Math.max(0, viewportWidth - 48),
      height: Math.max(0, viewportHeight - Math.max(24, viewportHeight * 0.22) - Math.max(24, viewportHeight * 0.24)),
      transform: "scale(0.98)",
    };
  }

  const containerWidth = Math.min(viewportWidth - 64, 1280);
  const previewWidth = Math.min(1120, containerWidth * 0.72);
  const previewHeight = previewWidth / (1460 / 920);
  const left = (viewportWidth - containerWidth) / 2 + containerWidth - previewWidth;
  const top = Math.max(40, (viewportHeight - previewHeight) / 2);

  return {
    top,
    left,
    width: previewWidth,
    height: previewHeight,
    transform: "scale(1)",
  };
}
