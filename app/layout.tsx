import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { RootProvider } from "@/app/root-provider";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "LeetSpeak",
  description:
    "A polished MVP for role-specific interview practice with realistic mock sessions, feedback, and progress tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} min-h-screen font-[var(--font-body)] text-foreground`}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
