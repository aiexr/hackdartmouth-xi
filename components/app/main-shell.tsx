"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  Flame,
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
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="hidden w-72 shrink-0 border-r border-border/80 bg-white/70 px-6 py-7 backdrop-blur md:flex md:flex-col">
        <Link href="/" className="flex items-center gap-3 px-2">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <BookOpenCheck className="size-5" />
          </div>
          <div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary/70">
              Interview Practice
            </div>
            <div className="text-lg font-semibold tracking-tight">
              LeetCode for Interviews
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
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-secondary text-secondary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-[1.75rem] border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-[0_24px_50px_-40px_rgba(251,146,60,0.7)]">
          <div className="flex items-center gap-2 text-orange-700">
            <Flame className="size-5" />
            <span className="text-sm font-semibold">7-day streak</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-orange-800/75">
            Keep the loop going. Consistency matters more than session length.
          </p>
          <div className="mt-4 flex gap-1.5">
            {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
              <div
                key={`${label}-${index}`}
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl text-[0.7rem] font-semibold",
                  index < 5
                    ? "bg-orange-500 text-white"
                    : index === 5
                      ? "bg-orange-200 text-orange-700"
                      : "bg-white/70 text-orange-400",
                )}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        <nav className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-[1.75rem] border border-border/80 bg-white/92 p-2 shadow-xl shadow-slate-900/5 backdrop-blur md:hidden">
          {navigation.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[0.72rem] font-medium",
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
