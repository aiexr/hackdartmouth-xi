"use client";

import { useEffect, useLayoutEffect, useState } from "react";
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
};

export default function AuthPopupHandoffPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"compact" | "expanded">("compact");
  const [geometry, setGeometry] = useState<PreviewGeometry | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useLayoutEffect(() => {
    let nextGeometry: PreviewGeometry | null = null;

    try {
      const raw = window.sessionStorage.getItem(AUTH_PREVIEW_GEOMETRY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PreviewGeometry;
        if (
          typeof parsed.top === "number" &&
          typeof parsed.left === "number" &&
          typeof parsed.width === "number" &&
          typeof parsed.height === "number"
        ) {
          nextGeometry = parsed;
        }
      }
    } catch {
      // Ignore malformed geometry and fall back to computed values.
    }

    if (!nextGeometry) {
      nextGeometry = getCompactViewportGeometry(
        window.innerWidth,
        window.innerHeight,
      );
    }

    setGeometry(nextGeometry);
    setIsHydrated(true);
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
        style={getHandoffStyle(stage, geometry, isHydrated)}
      >
        <ScaledDashboardPreview className="max-w-none" />
      </div>
    </div>
  );
}

function getHandoffStyle(
  stage: "compact" | "expanded",
  geometry: PreviewGeometry | null,
  isHydrated: boolean,
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

  if (isHydrated && geometry) {
    return {
      top: geometry.top,
      left: geometry.left,
      width: geometry.width,
      height: geometry.height,
      transform: "scale(1)",
    };
  }

  return {
    top: "12vh",
    left: "52vw",
    width: "44vw",
    height: "auto",
    aspectRatio: `${PREVIEW_NATURAL_WIDTH} / ${PREVIEW_NATURAL_HEIGHT}`,
    transform: "scale(1)",
  };
}

function getCompactViewportGeometry(
  viewportWidth: number,
  viewportHeight: number,
): PreviewGeometry {
  if (viewportWidth < 1024) {
    const top = Math.max(24, viewportHeight * 0.22);

    return {
      top,
      left: 24,
      width: Math.max(0, viewportWidth - 48),
      height: Math.max(
        0,
        viewportHeight - top - Math.max(24, viewportHeight * 0.24),
      ),
    };
  }

  const containerWidth = Math.min(viewportWidth - 64, 1280);
  const previewWidth = Math.min(1120, containerWidth * 0.72);
  const previewHeight = previewWidth / (PREVIEW_NATURAL_WIDTH / PREVIEW_NATURAL_HEIGHT);
  const left =
    (viewportWidth - containerWidth) / 2 + containerWidth - previewWidth;
  const top = Math.max(40, (viewportHeight - previewHeight) / 2);

  return {
    top,
    left,
    width: previewWidth,
    height: previewHeight,
  };
}
