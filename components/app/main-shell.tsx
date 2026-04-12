"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useTransition, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Home,
  Loader2,
  Play,
  Settings,
  User,
} from "lucide-react";
import { ThemeLogo } from "@/components/app/theme-logo";
import { cn } from "@/lib/utils";

function WhistleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 9h12a3 3 0 0 1 0 6H2z" />
      <path d="M17 10.5h5v3h-5" />
      <circle cx="8" cy="12" r="1.5" />
    </svg>
  );
}

const navigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: Play },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/coach", label: "LeetCoach", icon: WhistleIcon },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    for (const item of navigation) {
      router.prefetch(item.href);
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== "unauthenticated" || pathname === "/") {
      return;
    }

    router.replace("/");
    router.refresh();
  }, [pathname, router, status]);

  const navigateTo = (href: string) => {
    if (href === pathname) return;
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  };

  const prefetchRoute = (href: string) => {
    router.prefetch(href);
  };

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigateTo(href);
  };

  const activeHref = pendingHref ?? pathname;
  const hideLandingChrome =
    pathname === "/" && status !== "authenticated";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-base-100 px-4 py-7 md:flex md:flex-col">
        <Link href="/" className="flex items-center gap-3 px-3">
          <ThemeLogo alt="LeetSpeak logo" className="h-10 w-auto" />
          <span className="pt-2 text-base font-semibold tracking-tight">LeetSpeak</span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-0.5">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? activeHref === "/"
                : activeHref.startsWith(item.href);
            const isSpinning = pendingHref === item.href && isPending;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={(event) => handleNavClick(event, item.href)}
                onMouseEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
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
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {!hideLandingChrome ? (
          <header className="flex items-center justify-between border-b border-border px-6 py-3">
            <Link href="/" className="flex items-center gap-3 md:hidden">
              <ThemeLogo alt="LeetSpeak logo" className="h-9 w-auto" />
              <span className="text-sm font-semibold tracking-tight">LeetSpeak</span>
            </Link>
            {session?.user ? (
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
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
                      className="size-9 rounded-full ring-2 ring-border"
                    />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-content ring-2 ring-primary/20">
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
                <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-content ring-2 ring-primary/20">
                  <User className="size-4" />
                </div>
              </button>
            )}
          </header>
        ) : null}

        <main
          className={cn(
            "flex-1 transition-opacity duration-150",
            !hideLandingChrome && "pb-20 md:pb-0",
            isPending && "opacity-50",
          )}
        >
          {children}
        </main>

        {!hideLandingChrome ? (
          <nav className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-2xl border border-border bg-base-100/95 p-2 backdrop-blur md:hidden">
            {navigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? activeHref === "/"
                  : activeHref.startsWith(item.href);
              const isSpinning = pendingHref === item.href && isPending;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={(event) => handleNavClick(event, item.href)}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onFocus={() => prefetchRoute(item.href)}
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
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
