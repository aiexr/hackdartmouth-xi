"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Braces,
  Network,
  Search,
  Shuffle,
  Users,
} from "lucide-react";
import { MainShell } from "@/components/app/main-shell";
import { Input } from "@/components/ui/input";
import { scenarios, type Scenario } from "@/data/scenarios";
import { cn } from "@/lib/utils";

type RoundType = Scenario["category"];

const ROUND_ORDER: RoundType[] = ["behavioral", "technical", "system-design"];
const DIFFICULTY_ORDER: Scenario["difficulty"][] = [
  "Foundations",
  "Growth",
  "Stretch",
];

const roundMeta: Record<
  RoundType,
  {
    label: string;
    description: string;
    icon: typeof Users;
    pill: string;
  }
> = {
  behavioral: {
    label: "Behavioral",
    description: "STAR stories, leadership, conflict, product sense, and case studies.",
    icon: Users,
    pill: "border-sky-200 bg-sky-50 text-sky-700",
  },
  technical: {
    label: "Technical",
    description: "LeetCode-style coding with a live interviewer watching your editor.",
    icon: Braces,
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  "system-design": {
    label: "System Design",
    description: "Architecture, tradeoffs, scaling, and component design rounds.",
    icon: Network,
    pill: "border-violet-200 bg-violet-50 text-violet-700",
  },
};

const difficultyStyles: Record<Scenario["difficulty"], string> = {
  Foundations: "text-emerald-600",
  Growth: "text-amber-500",
  Stretch: "text-rose-500",
};

function matchesQuery(scenario: Scenario, query: string) {
  if (!query) return true;
  const haystack = [
    scenario.title,
    scenario.trackLabel,
    scenario.interviewer,
    scenario.category,
    scenario.pattern,
    ...scenario.focus,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default function PracticePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeRound, setActiveRound] = useState<RoundType>("behavioral");
  const normalizedQuery = query.trim().toLowerCase();

  const roundCounts = useMemo(
    () =>
      ROUND_ORDER.reduce(
        (counts, round) => {
          counts[round] = scenarios.filter((s) => s.category === round).length;
          return counts;
        },
        {} as Record<RoundType, number>,
      ),
    [],
  );

  const visibleScenarios = useMemo(
    () =>
      scenarios.filter(
        (s) => s.category === activeRound && matchesQuery(s, normalizedQuery),
      ),
    [activeRound, normalizedQuery],
  );

  const grouped = useMemo(
    () =>
      DIFFICULTY_ORDER.map((d) => ({
        difficulty: d,
        scenarios: visibleScenarios.filter((s) => s.difficulty === d),
      })).filter((g) => g.scenarios.length > 0),
    [visibleScenarios],
  );

  const activeMeta = roundMeta[activeRound];

  return (
    <MainShell>
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8 md:px-10 md:py-10">
        {/* Header */}
        <div>
          <h1>Practice</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Pick a round type, choose a problem, and start a live session.
          </p>
        </div>

        {/* Round type tabs */}
        <div className="flex items-center gap-2">
          {ROUND_ORDER.map((round) => {
            const meta = roundMeta[round];
            const active = activeRound === round;
            return (
              <button
                key={round}
                type="button"
                onClick={() => setActiveRound(round)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                <meta.icon className="size-4" />
                {meta.label}
                <span className="text-xs opacity-60">{roundCounts[round]}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => router.push("/practice/random")}
            className="ml-auto flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
          >
            <Shuffle className="size-4" />
            Random
          </button>
        </div>

        {/* Description + search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{activeMeta.description}</p>
          <label className="relative shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-9 w-full rounded-full border-border pl-10 sm:w-56"
              aria-label="Search scenarios"
            />
          </label>
        </div>

        {/* Problem list */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* Table header */}
          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_5rem_5rem] items-center gap-3 border-b border-border px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="text-center">#</span>
            <span>Title</span>
            <span>Time</span>
            <span>Difficulty</span>
          </div>

          {grouped.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No scenarios match the current filters.
            </div>
          )}

          {grouped.map(({ difficulty, scenarios: rows }) => (
            <div key={difficulty}>
              {/* Difficulty section header */}
              <div className="border-b border-border bg-muted/30 px-4 py-2">
                <span className={cn("text-xs font-semibold", difficultyStyles[difficulty])}>
                  {difficulty}
                </span>
              </div>

              {/* Rows */}
              {rows.map((scenario, idx) => {
                const globalIdx = scenarios.indexOf(scenario) + 1;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => router.push(`/practice/${scenario.id}`)}
                    className={cn(
                      "grid w-full grid-cols-[2.5rem_minmax(0,1fr)_5rem_5rem] items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-muted/40",
                      idx < rows.length - 1 && "border-b border-border/50",
                    )}
                  >
                    <span className="text-center text-xs text-muted-foreground">
                      {globalIdx}
                    </span>
                    <span className="truncate font-medium">{scenario.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {scenario.duration}
                    </span>
                    <span className={cn("text-xs font-medium", difficultyStyles[scenario.difficulty])}>
                      {scenario.difficulty === "Foundations"
                        ? "Easy"
                        : scenario.difficulty === "Growth"
                          ? "Medium"
                          : "Hard"}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </MainShell>
  );
}
