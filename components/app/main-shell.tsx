"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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
    if (href === pathname) {
      return;
    }

    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="hidden w-72 shrink-0 border-r border-base-300 bg-base-100 px-6 py-7 md:flex md:flex-col">
        <Link href="/" className="flex items-center gap-3 px-2">
          <img
            src="/logo.svg"
            alt="LeetSpeak logo"
            className="h-11 w-auto"
          />
          <div className="pt-0.5">
            <div className="text-lg font-semibold tracking-tight">
              LeetSpeak
            </div>
          </div>
        </Link>

        <nav className="mt-10 flex flex-1 flex-col gap-2">
          {navigation.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const pending = pendingHref === item.href && isPending;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                onClick={(event) => {
                  if (
                    event.defaultPrevented ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  ) {
                    return;
                  }

                  event.preventDefault();
                  navigateTo(item.href);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-none px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-neutral/10 text-base-content"
                    : "text-base-content/60 hover:bg-base-200 hover:text-base-content",
                )}
                aria-busy={pending || undefined}
              >
                {pending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <item.icon className="size-5" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-base-300 px-6 py-3">
          <Link href="/" className="flex items-center gap-3 md:hidden">
            <img
              src="/logo.svg"
              alt="LeetSpeak logo"
              className="h-9 w-auto"
            />
            <span className="text-sm font-semibold tracking-tight">
              LeetSpeak
            </span>
          </Link>
          {session?.user ? (
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-base-content/60 transition hover:text-base-content"
                title="Sign out"
              >
                Sign out
              </button>
              <Link
                href="/profile"
                className="cursor-pointer rounded-none transition-opacity hover:opacity-80"
                title="Profile"
              >
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
              className="ml-auto cursor-pointer rounded-none transition-opacity hover:opacity-80"
              title="Sign in with Google"
            >
              <div className="flex size-9 items-center justify-center rounded-none bg-primary text-primary-content ring-2 ring-primary/20">
                <User className="size-4" />
              </div>
            </button>
          )}
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        <nav className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-none border border-base-300 bg-base-100 p-2 md:hidden">
          {navigation.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const pending = pendingHref === item.href && isPending;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                onClick={(event) => {
                  if (
                    event.defaultPrevented ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  ) {
                    return;
                  }

                  event.preventDefault();
                  navigateTo(item.href);
                }}
                className={cn(
                  "flex min-w-16 flex-col items-center gap-1 rounded-none px-3 py-2 text-[0.72rem] font-medium",
                  active ? "text-primary" : "text-base-content/60",
                )}
                aria-busy={pending || undefined}
              >
                {pending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <item.icon className="size-5" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
