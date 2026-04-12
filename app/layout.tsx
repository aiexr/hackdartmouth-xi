import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { RootProvider } from "@/app/root-provider";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const metadataBase = new URL(getSiteUrl());
const socialImageUrl = new URL("/social-preview.png", metadataBase);

export const metadata: Metadata = {
  metadataBase,
  title: "LeetSpeak",
  description: "Speak your way through interviews.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      {
        url: "/logo.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: [
      {
        url: "/logo.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  openGraph: {
    title: "LeetSpeak",
    description: "Speak your way through interviews.",
    url: "/",
    siteName: "LeetSpeak",
    images: [
      {
        url: socialImageUrl,
        width: 1238,
        height: 446,
        alt: "LeetSpeak social preview",
        type: "image/png",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeetSpeak",
    description: "Speak your way through interviews.",
    images: [
      {
        url: socialImageUrl,
        alt: "LeetSpeak social preview",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Restore theme before first paint to avoid flash */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme')||'corporate';var dark=t==='dark';d.setAttribute('data-theme',t);d.style.colorScheme=dark?'dark':'light';d.style.backgroundColor=dark?'#13131f':'#fafaf8';d.style.color=dark?'#e5e5f0':'#1a1a2e';}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} min-h-screen font-(--font-body) text-base-content`}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
