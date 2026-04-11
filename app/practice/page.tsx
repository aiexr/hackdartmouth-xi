"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Search,
  Shuffle,
  Star,
} from "lucide-react";
import { MainShell } from "@/components/app/main-shell";
import { Input } from "@/components/ui/input";
import { scenarios, type Scenario } from "@/data/scenarios";
import { cn } from "@/lib/utils";

type PracticeCategory = "behavioral" | "technical" | "system-design";
type DifficultySort = "default" | "asc" | "desc";

const FAVORITES_STORAGE_KEY = "practice-favorite-scenarios";

const categoryMeta: Record<
  "all" | PracticeCategory,
  { label: string; description: string }
> = {
  all: {
    label: "All",
    description: "Every practice scenario in one queue.",
  },
  behavioral: {
    label: "Behavioral",
    description: "Stories, judgment, communication, and stakeholder prompts.",
  },
  technical: {
    label: "Technical",
    description: "Diagnosis, tradeoffs, metrics, and analytical drills.",
  },
  "system-design": {
    label: "System Design",
    description: "Architecture, scale, constraints, and systems decisions.",
  },
};

const scenarioCategories: Partial<Record<Scenario["id"], PracticeCategory>> = {
  "staff-swe-story": "behavioral",
  "staff-swe-mentorship": "behavioral",
  "staff-swe-system-design-intro": "system-design",
  "staff-swe-conflict": "behavioral",
  "staff-swe-incident": "technical",
  "staff-swe-tech-strategy": "behavioral",
  "staff-swe-ambiguous-initiative": "behavioral",
  "pm-metric-drop": "technical",
  "pm-product-sense": "behavioral",
  "pm-prioritization": "behavioral",
  "pm-stakeholder-pushback": "behavioral",
  "pm-launch-decision": "technical",
  "pm-zero-to-one": "behavioral",
  "consulting-market-sizing": "technical",
  "consulting-profitability": "technical",
  "consulting-market-entry": "behavioral",
  "consulting-client-pushback": "behavioral",
  "consulting-synthesis": "behavioral",
  "consulting-ops-turnaround": "technical",
};

const difficultySortOrder: Record<Scenario["difficulty"], number> = {
  Foundations: 0,
  Growth: 1,
  Stretch: 2,
};

const difficultyLabels: Record<Scenario["difficulty"], string> = {
  Foundations: "Easy",
  Growth: "Medium",
  Stretch: "Hard",
};

const difficultyBadgeStyles: Record<Scenario["difficulty"], string> = {
  Foundations: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Growth: "border-amber-200 bg-amber-50 text-amber-700",
  Stretch: "border-rose-200 bg-rose-50 text-rose-700",
};

const scenarioNumbers = new Map(
  scenarios.map((scenario, index) => [scenario.id, index + 1]),
);

function getScenarioCategory(scenario: Scenario): PracticeCategory {
  return scenarioCategories[scenario.id] ?? "behavioral";
}

function matchesQuery(scenario: Scenario, query: string) {
  if (!query) return true;

  const haystack = [
    scenario.title,
    scenario.trackLabel,
    scenario.interviewer,
    scenario.duration,
    difficultyLabels[scenario.difficulty],
    categoryMeta[getScenarioCategory(scenario)].label,
    ...scenario.focus,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function DifficultyBadge({ difficulty }: { difficulty: Scenario["difficulty"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.7rem]",
        difficultyBadgeStyles[difficulty],
      )}
      style={{ fontWeight: 500 }}
    >
      {difficultyLabels[difficulty]}
    </span>
  );
}

export default function PracticePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | PracticeCategory>(
    "all",
  );
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
      // Ignore corrupted storage and recover with an empty favorites list.
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
      // Storage is best-effort only for this view.
    }
  }, [favoriteIds, favoritesHydrated]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const normalizedQuery = query.trim().toLowerCase();

  const categoryCounts = useMemo(
    () => ({
      behavioral: scenarios.filter(
        (scenario) => getScenarioCategory(scenario) === "behavioral",
      ).length,
      technical: scenarios.filter(
        (scenario) => getScenarioCategory(scenario) === "technical",
      ).length,
      "system-design": scenarios.filter(
        (scenario) => getScenarioCategory(scenario) === "system-design",
      ).length,
    }),
    [],
  );

  const visibleScenarios = useMemo(() => {
    const filtered = scenarios.filter((scenario) => {
      if (activeCategory !== "all" && getScenarioCategory(scenario) !== activeCategory) {
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
        difficultySortOrder[left.difficulty] - difficultySortOrder[right.difficulty];

      if (difficultyDelta !== 0) {
        return difficultyDelta * direction;
      }

      return (
        (scenarioNumbers.get(left.id) ?? 0) - (scenarioNumbers.get(right.id) ?? 0)
      );
    });
  }, [activeCategory, difficultySort, favoriteSet, favoritesOnly, normalizedQuery]);

  const randomRowMatches =
    !favoritesOnly &&
    activeCategory === "all" &&
    (normalizedQuery.length === 0 ||
      ["random", "shuffle", "surprise"].some((keyword) =>
        keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword),
      ));

  const summaryText =
    activeCategory === "all"
      ? "Browse the full bank, narrow by interview mode, and sort difficulty like a problem set."
      : categoryMeta[activeCategory].description;

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

  function handleRowNavigation(href: string) {
    router.push(href);
  }

  return (
    <MainShell>
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 md:px-10 md:py-10">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1>Practice</h1>
              <p className="mt-2 text-base text-muted-foreground">
                {summaryText}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <div className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Scenarios
                </div>
                <div className="mt-1 text-2xl" style={{ fontWeight: 700 }}>
                  {scenarios.length}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <div className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Visible
                </div>
                <div className="mt-1 text-2xl" style={{ fontWeight: 700 }}>
                  {visibleScenarios.length + (randomRowMatches ? 1 : 0)}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <div className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Saved
                </div>
                <div className="mt-1 text-2xl" style={{ fontWeight: 700 }}>
                  {favoriteIds.length}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
              <Search className="size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles, tracks, interviewers, or focus areas"
                className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                aria-label="Search scenarios"
              />
            </div>

            <button
              type="button"
              onClick={() => setFavoritesOnly((current) => !current)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors",
                favoritesOnly
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              <Star
                className={cn(
                  "size-4",
                  favoritesOnly && "fill-current",
                )}
              />
              Favorites only
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                "all",
                "behavioral",
                "technical",
                "system-design",
              ] as const
            ).map((categoryId) => {
              const active = activeCategory === categoryId;
              const count =
                categoryId === "all"
                  ? scenarios.length
                  : categoryCounts[categoryId];

              return (
                <button
                  key={categoryId}
                  type="button"
                  onClick={() => setActiveCategory(categoryId)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                    active
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>{categoryMeta[categoryId].label}</span>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[0.72rem] text-inherit">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-[2.75rem_3rem_minmax(0,1fr)_7rem] items-center gap-3 border-b border-border px-4 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground md:grid-cols-[2.75rem_3rem_minmax(0,1.6fr)_8.5rem_7rem_5.5rem]">
            <span className="sr-only">Favorite</span>
            <span>#</span>
            <span>Title</span>
            <span className="hidden md:block">Type</span>
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
                  onClick={() => handleRowNavigation("/practice/random")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowNavigation("/practice/random");
                    }
                  }}
                  className="grid cursor-pointer grid-cols-[2.75rem_3rem_minmax(0,1fr)_7rem] items-center gap-3 bg-primary/[0.03] px-4 py-4 transition-colors hover:bg-primary/[0.06] md:grid-cols-[2.75rem_3rem_minmax(0,1.6fr)_8.5rem_7rem_5.5rem]"
                >
                  <span className="flex items-center justify-center text-primary">
                    <Shuffle className="size-4" />
                  </span>
                  <span className="text-sm text-muted-foreground">0</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm">Random scenario</p>
                    <p className="mt-1 text-[0.82rem] text-muted-foreground md:hidden">
                      Surprise prompt · Mixed · Varies
                    </p>
                    <p className="mt-1 hidden text-[0.82rem] text-muted-foreground md:block">
                      Jump into a surprise prompt without previewing the exact question first.
                    </p>
                  </div>
                  <span className="hidden text-sm text-muted-foreground md:block">
                    Random
                  </span>
                  <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[0.7rem] text-primary">
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
                  Try clearing search, switching filters, or saving a few favorites first.
                </p>
              </li>
            ) : null}

            {visibleScenarios.map((scenario) => {
              const isFavorite = favoriteSet.has(scenario.id);
              const category = getScenarioCategory(scenario);

              return (
                <li key={scenario.id}>
                  <div
                    role="link"
                    tabIndex={0}
                    onClick={() => handleRowNavigation(`/practice/${scenario.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleRowNavigation(`/practice/${scenario.id}`);
                      }
                    }}
                    className="grid cursor-pointer grid-cols-[2.75rem_3rem_minmax(0,1fr)_7rem] items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[2.75rem_3rem_minmax(0,1.6fr)_8.5rem_7rem_5.5rem]"
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
                          "inline-flex size-8 items-center justify-center rounded-full transition-colors",
                          isFavorite
                            ? "text-amber-500 hover:text-amber-600"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Star
                          className={cn("size-4", isFavorite && "fill-current")}
                        />
                      </button>
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {scenarioNumbers.get(scenario.id)}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm">{scenario.title}</p>
                      <p className="mt-1 truncate text-[0.82rem] text-muted-foreground">
                        {scenario.trackLabel} · {scenario.interviewer}
                      </p>
                      <p className="mt-1 text-[0.82rem] text-muted-foreground md:hidden">
                        {categoryMeta[category].label} · {scenario.duration}
                      </p>
                    </div>

                    <span className="hidden text-sm text-muted-foreground md:block">
                      {categoryMeta[category].label}
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
      </div>
    </MainShell>
  );
}
