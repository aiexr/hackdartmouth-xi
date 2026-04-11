"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
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

const FAVORITES_STORAGE_KEY = "practice-favorite-scenarios";
const ROUND_ORDER: RoundType[] = [
  "behavioral",
  "technical",
  "system-design",
  "product",
  "case-study",
];
const DIFFICULTY_ORDER: Scenario["difficulty"][] = [
  "Foundations",
  "Growth",
  "Stretch",
];

const roundMeta: Record<
  RoundType,
  {
    label: string;
    summary: string;
    detail: string;
    icon: typeof Users;
    accent: string;
    pill: string;
  }
> = {
  behavioral: {
    label: "Behavioral",
    summary: "Classic STAR stories with a direct interviewer.",
    detail:
      "Avatar plus transcript only. Expect story-based prompts around leadership, conflict, mentorship, and execution.",
    icon: Users,
    accent: "from-sky-500/15 via-blue-500/10 to-transparent",
    pill: "border-sky-200 bg-sky-50 text-sky-700",
  },
  technical: {
    label: "Technical Coding",
    summary: "LeetCode-style coding with live probing on code and complexity.",
    detail:
      "Avatar plus Monaco editor side-by-side. The interviewer can react to your current code and push on correctness, tradeoffs, and complexity.",
    icon: Braces,
    accent: "from-emerald-500/15 via-teal-500/10 to-transparent",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  "system-design": {
    label: "System Design",
    summary: "Scoping, architecture, and tradeoff-heavy design rounds.",
    detail:
      "Avatar plus transcript only for now. Start with requirements, then structure the components, data flows, bottlenecks, and failure modes.",
    icon: Network,
    accent: "from-violet-500/15 via-fuchsia-500/10 to-transparent",
    pill: "border-violet-200 bg-violet-50 text-violet-700",
  },
  product: {
    label: "Product & Strategy",
    summary: "Stakeholder and executive-style product judgment rounds.",
    detail:
      "Avatar plus transcript only. Expect metric diagnosis, prioritization, launch calls, and strategic tradeoff discussions.",
    icon: BriefcaseBusiness,
    accent: "from-amber-500/15 via-orange-500/10 to-transparent",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
  },
  "case-study": {
    label: "Case Study",
    summary: "Engagement-manager-style structured business cases.",
    detail:
      "Avatar plus transcript only. Expect explicit structure, assumptions, synthesis, and a recommendation under pressure.",
    icon: BriefcaseBusiness,
    accent: "from-rose-500/15 via-pink-500/10 to-transparent",
    pill: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

const difficultyBadgeStyles: Record<Scenario["difficulty"], string> = {
  Foundations: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Growth: "border-amber-200 bg-amber-50 text-amber-700",
  Stretch: "border-rose-200 bg-rose-50 text-rose-700",
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
    scenario.pattern,
    ...scenario.focus,
    scenario.codingProblem?.description ?? "",
    scenario.codingProblem?.optimalApproach ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function DifficultyBadge({ difficulty }: { difficulty: Scenario["difficulty"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.7rem] font-medium",
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
  const [activeRound, setActiveRound] = useState<RoundType>("behavioral");
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
          counts[round] = scenarios.filter((scenario) => scenario.category === round).length;
          return counts;
        },
        {} as Record<RoundType, number>,
      ),
    [],
  );

  const visibleScenarios = useMemo(() => {
    return scenarios.filter((scenario) => {
      if (scenario.category !== activeRound) {
        return false;
      }

      if (favoritesOnly && !favoriteSet.has(scenario.id)) {
        return false;
      }

      return matchesQuery(scenario, normalizedQuery);
    });
  }, [activeRound, favoriteSet, favoritesOnly, normalizedQuery]);

  const scenariosByDifficulty = useMemo(
    () =>
      DIFFICULTY_ORDER.map((difficulty) => ({
        difficulty,
        scenarios: visibleScenarios
          .filter((scenario) => scenario.difficulty === difficulty)
          .sort(
            (left, right) =>
              (scenarioNumbers.get(left.id) ?? 0) - (scenarioNumbers.get(right.id) ?? 0),
          ),
      })),
    [visibleScenarios],
  );

  const activeMeta = roundMeta[activeRound];
  const totalVisible = visibleScenarios.length;
  const favoriteCount = visibleScenarios.filter((scenario) =>
    favoriteSet.has(scenario.id),
  ).length;

  function toggleFavorite(id: string) {
    setFavoriteIds((current) =>
      current.includes(id)
        ? current.filter((favoriteId) => favoriteId !== id)
        : [...current, id],
    );
  }

  return (
    <MainShell>
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 md:px-10 md:py-10">
        <section
          className={cn(
            "overflow-hidden rounded-[28px] border border-border bg-card",
            "bg-gradient-to-br",
            activeMeta.accent,
          )}
        >
          <div className="space-y-6 p-6 md:p-8">
            <div className="max-w-3xl space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Practice by Round Type
              </p>
              <div className="flex items-center gap-3">
                <div className={cn("rounded-2xl border px-3 py-2", activeMeta.pill)}>
                  <activeMeta.icon className="size-5" />
                </div>
                <div>
                  <h1>{activeMeta.label}</h1>
                  <p className="mt-1 text-base text-muted-foreground">
                    {activeMeta.summary}
                  </p>
                </div>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {activeMeta.detail}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              {ROUND_ORDER.map((round) => {
                const meta = roundMeta[round];
                const active = activeRound === round;
                return (
                  <button
                    key={round}
                    type="button"
                    onClick={() => setActiveRound(round)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition",
                      active
                        ? "border-foreground bg-background shadow-sm"
                        : "border-border/70 bg-background/70 hover:border-foreground/20 hover:bg-background",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <meta.icon className="mt-0.5 size-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {roundCounts[round]}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold">{meta.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {meta.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${activeMeta.label.toLowerCase()} scenarios`}
                  className="h-11 rounded-full border-border/70 bg-background pl-10"
                  aria-label="Search scenarios"
                />
              </label>

              <button
                type="button"
                onClick={() => router.push("/practice/random")}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-medium transition hover:border-foreground/20 hover:bg-background/95"
              >
                <Shuffle className="size-4" />
                Random
              </button>

              <button
                type="button"
                onClick={() => setFavoritesOnly((value) => !value)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                  favoritesOnly
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-border/70 bg-background hover:border-foreground/20 hover:bg-background/95",
                )}
              >
                <Star
                  className={cn(
                    "size-4",
                    favoritesOnly && "fill-current",
                  )}
                />
                Favorites
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <section className="space-y-4">
            {scenariosByDifficulty.map(({ difficulty, scenarios: difficultyScenarios }) => (
              <div
                key={difficulty}
                className="rounded-[24px] border border-border bg-card p-5 md:p-6"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl">{difficulty}</h2>
                    <p className="text-sm text-muted-foreground">
                      {difficulty === "Foundations"
                        ? "Core reps with straightforward prompts and expected structure."
                        : difficulty === "Growth"
                          ? "More ambiguity, follow-up pressure, and broader tradeoffs."
                          : "Stretch rounds where depth, control, and prioritization matter."}
                    </p>
                  </div>
                  <DifficultyBadge difficulty={difficulty} />
                </div>

                {difficultyScenarios.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                    No {difficulty.toLowerCase()} scenarios match the current filters.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {difficultyScenarios.map((scenario) => {
                      const isFavorite = favoriteSet.has(scenario.id);
                      const preview =
                        scenario.category === "technical"
                          ? scenario.codingProblem?.description ?? scenario.prompt
                          : scenario.prompt;

                      return (
                        <button
                          key={scenario.id}
                          type="button"
                          onClick={() => router.push(`/practice/${scenario.id}`)}
                          className="group rounded-[22px] border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  #{scenarioNumbers.get(scenario.id)}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full border px-2 py-0.5 text-[0.7rem] font-medium",
                                    roundMeta[scenario.category].pill,
                                  )}
                                >
                                  {roundMeta[scenario.category].label}
                                </span>
                                <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
                                  {formatPattern(scenario.pattern)}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold">{scenario.title}</h3>
                                <DifficultyBadge difficulty={scenario.difficulty} />
                              </div>

                              <p className="mt-1 text-sm text-muted-foreground">
                                {scenario.interviewer} · {scenario.interviewerRole} ·{" "}
                                {scenario.duration}
                              </p>

                              <p className="mt-3 text-sm leading-6 text-foreground/85">
                                {preview}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {scenario.focus.slice(0, 3).map((focus) => (
                                  <span
                                    key={focus}
                                    className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[0.7rem] text-muted-foreground"
                                  >
                                    {focus}
                                  </span>
                                ))}
                              </div>
                            </div>

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
                              className={cn(
                                "rounded-full border p-2 transition",
                                isFavorite
                                  ? "border-amber-300 bg-amber-50 text-amber-600"
                                  : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                              )}
                            >
                              <Star className={cn("size-4", isFavorite && "fill-current")} />
                            </button>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </section>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Active Queue
              </p>
              <h2 className="mt-2 text-xl">{activeMeta.label}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {activeMeta.detail}
              </p>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Visible scenarios</p>
                  <p className="mt-1 text-2xl font-semibold">{totalVisible}</p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Favorites in this round</p>
                  <p className="mt-1 text-2xl font-semibold">{favoriteCount}</p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Round total</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {roundCounts[activeRound]}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Difficulty Flow
              </p>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Foundations</span>:
                  establish the base structure and core mental model.
                </p>
                <p>
                  <span className="font-medium text-foreground">Growth</span>: handle
                  ambiguity, probing, and more moving pieces.
                </p>
                <p>
                  <span className="font-medium text-foreground">Stretch</span>: defend
                  tradeoffs under pressure and keep the answer sharp.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </MainShell>
  );
}
