"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Bot,
  Home,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/llm", label: "LLM", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="hidden w-72 shrink-0 border-r border-border bg-card px-6 py-7 md:flex md:flex-col">
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

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-none px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                title="Sign out"
              >
                Sign out
              </button>
              <Link
                href="/profile"
                className="cursor-pointer rounded-full transition-opacity hover:opacity-80"
                title="Profile"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="size-9 rounded-full ring-2 ring-border"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-primary/20">
                    <User className="size-4" />
                  </div>
                )}
              </Link>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="cursor-pointer rounded-full transition-opacity hover:opacity-80"
              title="Sign in with Google"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-primary/20">
                <User className="size-4" />
              </div>
            </button>
          )}
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        <nav className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-none border border-border bg-card p-2 md:hidden">
          {navigation.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-16 flex-col items-center gap-1 rounded-none px-3 py-2 text-[0.72rem] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
