"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useTransition, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Bot,
  Home,
  Loader2,
  Play,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { ThemeLogo } from "@/components/app/theme-logo";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: Play },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/llm", label: "LLM", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const navigateTo = (href: string) => {
    if (href === pathname) return;
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  };

  // The "active" tab is either confirmed (pathname) or optimistically set (pendingHref)
  const activeHref = pendingHref ?? pathname;

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-base-100 px-4 py-7 md:flex md:flex-col">
        <Link href="/" className="flex items-center gap-3 px-3">
          <ThemeLogo alt="LeetSpeak logo" className="h-10 w-auto" />
          <span className="text-base font-semibold tracking-tight">LeetSpeak</span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-0.5">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? activeHref === "/"
                : activeHref.startsWith(item.href);
            const isSpinning = pendingHref === item.href && isPending;

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigateTo(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-base-content/60 hover:bg-base-200 hover:text-base-content",
                )}
              >
                {isSpinning ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" />
                ) : (
                  <item.icon className="size-4 shrink-0" />
                )}
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <Link href="/" className="flex items-center gap-3 md:hidden">
              <ThemeLogo alt="LeetSpeak logo" className="h-9 w-auto" />
            <span className="text-sm font-semibold tracking-tight">LeetSpeak</span>
          </Link>
          {session?.user ? (
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-base-content/60 transition hover:text-base-content"
              >
                Sign out
              </button>
              <Link href="/profile" className="cursor-pointer transition-opacity hover:opacity-80">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="size-9 rounded-none ring-2 ring-border"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-none bg-primary text-primary-content ring-2 ring-primary/20">
                    <User className="size-4" />
                  </div>
                )}
              </Link>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="ml-auto cursor-pointer transition-opacity hover:opacity-80"
            >
              <div className="flex size-9 items-center justify-center rounded-none bg-primary text-primary-content ring-2 ring-primary/20">
                <User className="size-4" />
              </div>
            </button>
          )}
        </header>

        <main
          className={cn(
            "flex-1 pb-20 md:pb-0 transition-opacity duration-150",
            isPending && "opacity-50",
          )}
        >
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-2xl border border-border bg-base-100/95 p-2 backdrop-blur md:hidden">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? activeHref === "/"
                : activeHref.startsWith(item.href);
            const isSpinning = pendingHref === item.href && isPending;

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigateTo(item.href)}
                className={cn(
                  "flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[0.7rem] font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-base-content/60",
                )}
              >
                {isSpinning ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <item.icon className="size-5" />
                )}
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
