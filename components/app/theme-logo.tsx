"use client";

import { useEffect, useState } from "react";

type ThemeLogoProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  lightSrc?: string;
  darkSrc?: string;
};

export function ThemeLogo({
  lightSrc = "/logo.svg",
  darkSrc = "/logo-dark.svg",
  ...imgProps
}: ThemeLogoProps) {
  const [src, setSrc] = useState(lightSrc);

  useEffect(() => {
    const root = document.documentElement;

    const syncSrc = () => {
      const theme = root.getAttribute("data-theme");
      setSrc(theme === "dark" ? darkSrc : lightSrc);
    };

    syncSrc();

    const observer = new MutationObserver(syncSrc);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, [darkSrc, lightSrc]);

  return <img src={src} {...imgProps} />;
}
