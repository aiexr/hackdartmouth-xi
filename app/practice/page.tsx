"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BriefcaseBusiness,
  Braces,
  Network,
  Search,
  Shuffle,
  Star,
  Users,
} from "lucide-react";
import { MainShell } from "@/components/app/main-shell";
import { Input } from "@/components/ui/input";
import { scenarios, type Scenario } from "@/data/scenarios";
import { cn } from "@/lib/utils";

type RoundType = Scenario["category"];
type DifficultySort = "default" | "asc" | "desc";

const FAVORITES_STORAGE_KEY = "practice-favorite-scenarios";
const ROUND_ORDER: RoundType[] = [
  "behavioral",
  "technical",
  "system-design",
  "product",
  "case-study",
];

const difficultyOrder: Record<Scenario["difficulty"], number> = {
  Foundations: 0,
  Growth: 1,
  Stretch: 2,
};

const difficultyBadgeStyles: Record<Scenario["difficulty"], string> = {
  Foundations: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Growth: "border-amber-200 bg-amber-50 text-amber-700",
  Stretch: "border-rose-200 bg-rose-50 text-rose-700",
};

const roundMeta: Record<
  RoundType,
  {
    label: string;
    summary: string;
    icon: typeof Users;
    pill: string;
  }
> = {
  behavioral: {
    label: "Behavioral",
    summary: "Stories, judgment, and communication-heavy reps.",
    icon: Users,
    pill: "border-sky-200 bg-sky-50 text-sky-700",
  },
  technical: {
    label: "Technical Coding",
    summary: "Code, complexity, and debugging pressure.",
    icon: Braces,
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  "system-design": {
    label: "System Design",
    summary: "Requirements, architecture, and tradeoffs.",
    icon: Network,
    pill: "border-violet-200 bg-violet-50 text-violet-700",
  },
  product: {
    label: "Product & Strategy",
    summary: "Metrics, prioritization, and executive calls.",
    icon: BriefcaseBusiness,
    pill: "border-amber-200 bg-amber-50 text-amber-700",
  },
  "case-study": {
    label: "Case Study",
    summary: "Structured business cases and synthesis.",
    icon: BriefcaseBusiness,
    pill: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

const scenarioNumbers = new Map(
  scenarios.map((scenario, index) => [scenario.id, index + 1]),
);

function formatPattern(pattern: string) {
  return pattern
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function matchesQuery(scenario: Scenario, query: string) {
  if (!query) return true;

  const haystack = [
    scenario.title,
    scenario.trackLabel,
    scenario.interviewer,
    scenario.interviewerRole,
    scenario.duration,
    scenario.category,
    roundMeta[scenario.category].label,
    scenario.pattern,
    ...scenario.focus,
    scenario.codingProblem?.description ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function DifficultyBadge({ difficulty }: { difficulty: Scenario["difficulty"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none border px-2.5 py-1 text-[0.7rem] font-medium",
        difficultyBadgeStyles[difficulty],
      )}
    >
      {difficulty}
    </span>
  );
}

export default function PracticePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeRound, setActiveRound] = useState<"all" | RoundType>("all");
  const [difficultySort, setDifficultySort] =
    useState<DifficultySort>("default");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoritesHydrated, setFavoritesHydrated] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavoriteIds(
            parsed.filter(
              (value): value is string =>
                typeof value === "string" &&
                scenarios.some((scenario) => scenario.id === value),
            ),
          );
        }
      }
    } catch {
      // Best-effort only.
    }
    setFavoritesHydrated(true);
  }, []);

  useEffect(() => {
    if (!favoritesHydrated) return;
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoriteIds),
      );
    } catch {
      // Best-effort only.
    }
  }, [favoriteIds, favoritesHydrated]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const normalizedQuery = query.trim().toLowerCase();

  const roundCounts = useMemo(
    () =>
      ROUND_ORDER.reduce(
        (counts, round) => {
          counts[round] = scenarios.filter(
            (scenario) => scenario.category === round,
          ).length;
          return counts;
        },
        {} as Record<RoundType, number>,
      ),
    [],
  );

  const visibleScenarios = useMemo(() => {
    const filtered = scenarios.filter((scenario) => {
      if (activeRound !== "all" && scenario.category !== activeRound) {
        return false;
      }

      if (favoritesOnly && !favoriteSet.has(scenario.id)) {
        return false;
      }

      return matchesQuery(scenario, normalizedQuery);
    });

    if (difficultySort === "default") {
      return filtered;
    }

    const direction = difficultySort === "asc" ? 1 : -1;

    return [...filtered].sort((left, right) => {
      const difficultyDelta =
        difficultyOrder[left.difficulty] - difficultyOrder[right.difficulty];

      if (difficultyDelta !== 0) {
        return difficultyDelta * direction;
      }

      return (
        (scenarioNumbers.get(left.id) ?? 0) - (scenarioNumbers.get(right.id) ?? 0)
      );
    });
  }, [activeRound, difficultySort, favoriteSet, favoritesOnly, normalizedQuery]);

  const totalVisible = visibleScenarios.length;
  const savedVisibleCount = visibleScenarios.filter((scenario) =>
    favoriteSet.has(scenario.id),
  ).length;
  const randomRowMatches =
    !favoritesOnly &&
    activeRound === "all" &&
    (normalizedQuery.length === 0 ||
      ["random", "shuffle", "surprise"].some((keyword) =>
        keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword),
      ));

  const summaryText =
    activeRound === "all"
      ? "Use round filters, search, favorites, and difficulty sorting to work the bank like a problem set."
      : roundMeta[activeRound].summary;

  function toggleFavorite(id: string) {
    setFavoriteIds((current) =>
      current.includes(id)
        ? current.filter((favoriteId) => favoriteId !== id)
        : [...current, id],
    );
  }

  function cycleDifficultySort() {
    setDifficultySort((current) => {
      if (current === "default") return "asc";
      if (current === "asc") return "desc";
      return "default";
    });
  }

  function navigateTo(href: string) {
    router.push(href);
  }

  return (
    <MainShell>
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 md:px-10 md:py-10">
        <section className="border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Practice
              </p>
              <h1 className="mt-2">Question Bank</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {summaryText}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="border border-border bg-background px-4 py-3">
                <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Scenarios
                </p>
                <p className="mt-1 text-2xl font-semibold">{scenarios.length}</p>
              </div>
              <div className="border border-border bg-background px-4 py-3">
                <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Visible
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {totalVisible + (randomRowMatches ? 1 : 0)}
                </p>
              </div>
              <div className="border border-border bg-background px-4 py-3">
                <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Saved
                </p>
                <p className="mt-1 text-2xl font-semibold">{favoriteIds.length}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="flex items-center gap-3 border border-border bg-background px-4 py-3">
              <Search className="size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles, tracks, interviewers, patterns, or focus areas"
                className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                aria-label="Search scenarios"
              />
            </div>

            <button
              type="button"
              onClick={() => navigateTo("/practice/random")}
              className="inline-flex items-center justify-center gap-2 border border-border bg-background px-4 py-3 text-sm font-medium transition hover:border-foreground/20 hover:bg-muted/30"
            >
              <Shuffle className="size-4" />
              Question 0
            </button>

            <button
              type="button"
              onClick={() => setFavoritesOnly((value) => !value)}
              className={cn(
                "inline-flex items-center justify-center gap-2 border px-4 py-3 text-sm font-medium transition",
                favoritesOnly
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-border bg-background hover:border-foreground/20 hover:bg-muted/30",
              )}
            >
              <Star className={cn("size-4", favoritesOnly && "fill-current")} />
              Favorites only
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["all", ...ROUND_ORDER] as const).map((round) => {
              const active = activeRound === round;
              const Icon = round === "all" ? Shuffle : roundMeta[round].icon;
              const count = round === "all" ? scenarios.length : roundCounts[round];
              const label = round === "all" ? "All" : roundMeta[round].label;

              return (
                <button
                  key={round}
                  type="button"
                  onClick={() => setActiveRound(round)}
                  className={cn(
                    "inline-flex items-center gap-2 border px-4 py-2 text-sm transition",
                    active
                      ? "border-foreground bg-background"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{label}</span>
                  <span className="border border-border bg-muted/40 px-2 py-0.5 text-[0.72rem] text-inherit">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden border border-border bg-card">
          <div className="grid grid-cols-[2.75rem_3rem_minmax(0,1fr)_7rem] items-center gap-3 border-b border-border px-4 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground md:grid-cols-[2.75rem_3rem_minmax(0,1.7fr)_8rem_9rem_7rem_5.5rem]">
            <span className="sr-only">Favorite</span>
            <span>#</span>
            <span>Title</span>
            <span className="hidden md:block">Type</span>
            <span className="hidden md:block">Pattern</span>
            <button
              type="button"
              onClick={cycleDifficultySort}
              className="inline-flex items-center gap-1 text-left text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
            >
              <span>Difficulty</span>
              {difficultySort === "asc" ? (
                <ArrowUpWideNarrow className="size-3.5" />
              ) : difficultySort === "desc" ? (
                <ArrowDownWideNarrow className="size-3.5" />
              ) : (
                <ArrowUpWideNarrow className="size-3.5 opacity-50" />
              )}
            </button>
            <span className="hidden md:block">Time</span>
          </div>

          <ul className="divide-y divide-border">
            {randomRowMatches ? (
              <li>
                <div
                  role="link"
                  tabIndex={0}
                  onClick={() => navigateTo("/practice/random")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigateTo("/practice/random");
                    }
                  }}
                  className="grid cursor-pointer grid-cols-[2.75rem_3rem_minmax(0,1fr)_7rem] items-center gap-3 bg-muted/20 px-4 py-4 transition-colors hover:bg-muted/35 md:grid-cols-[2.75rem_3rem_minmax(0,1.7fr)_8rem_9rem_7rem_5.5rem]"
                >
                  <span className="flex items-center justify-center text-primary">
                    <Shuffle className="size-4" />
                  </span>
                  <span className="text-sm text-muted-foreground">0</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">Random scenario</p>
                    <p className="mt-1 text-[0.82rem] text-muted-foreground">
                      Surprise pick from the full bank without previewing the title first.
                    </p>
                  </div>
                  <span className="hidden text-sm text-muted-foreground md:block">
                    Mixed
                  </span>
                  <span className="hidden text-sm text-muted-foreground md:block">
                    Surprise
                  </span>
                  <span className="inline-flex items-center border border-border bg-background px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground">
                    Mixed
                  </span>
                  <span className="hidden text-sm text-muted-foreground md:block">
                    Varies
                  </span>
                </div>
              </li>
            ) : null}

            {visibleScenarios.length === 0 && !randomRowMatches ? (
              <li className="px-6 py-10 text-center">
                <p>No scenarios match this view.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Clear the search, switch the round filter, or save a few favorites first.
                </p>
              </li>
            ) : null}

            {visibleScenarios.map((scenario) => {
              const isFavorite = favoriteSet.has(scenario.id);

              return (
                <li key={scenario.id}>
                  <div
                    role="link"
                    tabIndex={0}
                    onClick={() => navigateTo(`/practice/${scenario.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigateTo(`/practice/${scenario.id}`);
                      }
                    }}
                    className="grid cursor-pointer grid-cols-[2.75rem_3rem_minmax(0,1fr)_7rem] items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30 md:grid-cols-[2.75rem_3rem_minmax(0,1.7fr)_8rem_9rem_7rem_5.5rem]"
                  >
                    <span className="flex items-center justify-center">
                      <button
                        type="button"
                        aria-label={
                          isFavorite
                            ? `Remove ${scenario.title} from favorites`
                            : `Add ${scenario.title} to favorites`
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(scenario.id);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                        className={cn(
                          "inline-flex size-8 items-center justify-center border transition",
                          isFavorite
                            ? "border-amber-300 bg-amber-50 text-amber-600"
                            : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                        )}
                      >
                        <Star className={cn("size-4", isFavorite && "fill-current")} />
                      </button>
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {scenarioNumbers.get(scenario.id)}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{scenario.title}</p>
                      <p className="mt-1 truncate text-[0.82rem] text-muted-foreground">
                        {scenario.trackLabel} · {scenario.interviewer} · {scenario.interviewerRole}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 md:hidden">
                        <span
                          className={cn(
                            "border px-2 py-0.5 text-[0.7rem] font-medium",
                            roundMeta[scenario.category].pill,
                          )}
                        >
                          {roundMeta[scenario.category].label}
                        </span>
                        <span className="border border-border bg-muted/40 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
                          {formatPattern(scenario.pattern)}
                        </span>
                        <span className="text-[0.78rem] text-muted-foreground">
                          {scenario.duration}
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "hidden w-fit border px-2 py-0.5 text-[0.7rem] font-medium md:inline-flex",
                        roundMeta[scenario.category].pill,
                      )}
                    >
                      {roundMeta[scenario.category].label}
                    </span>

                    <span className="hidden text-sm text-muted-foreground md:block">
                      {formatPattern(scenario.pattern)}
                    </span>

                    <DifficultyBadge difficulty={scenario.difficulty} />

                    <span className="hidden text-sm text-muted-foreground md:block">
                      {scenario.duration}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="border border-border bg-card p-4">
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
              Active Filter
            </p>
            <p className="mt-2 text-lg font-semibold">
              {activeRound === "all" ? "All Rounds" : roundMeta[activeRound].label}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeRound === "all"
                ? "Everything in one queue so you can scan and choose fast."
                : roundMeta[activeRound].summary}
            </p>
          </div>

          <div className="border border-border bg-card p-4">
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
              Visible Favorites
            </p>
            <p className="mt-2 text-lg font-semibold">{savedVisibleCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Star rows to build a short list of repeat reps.
            </p>
          </div>

          <div className="border border-border bg-card p-4">
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
              Difficulty Flow
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sort difficulty to move from foundations into stretch rounds without losing the
              scenario numbers.
            </p>
          </div>
        </section>
      </div>
    </MainShell>
  );
}
