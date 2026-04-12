"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Braces,
  ChevronRight,
  Code2,
  Loader2,
  Network,
  Search,
  Shuffle,
  Star,
  Users,
} from "lucide-react";
import type { FavoriteItem } from "@/lib/favorites";
import {
  quantProblemCategories,
  quantProblems,
} from "@/data/quant-problems";
import { scenarios, type Scenario } from "@/data/scenarios";
import { cn } from "@/lib/utils";

// LeetCode slugs that have fully pre-built scenarios — go to the normal practice route
const PREBUILT_SLUG_TO_SCENARIO: Record<string, string> = {
  "two-sum": "technical-two-sum",
  "valid-parentheses": "technical-valid-parentheses",
  "merge-intervals": "technical-merge-intervals",
  "top-k-frequent-elements": "technical-top-k-frequent",
  "lru-cache": "technical-lru-cache",
  "word-ladder": "technical-word-ladder",
  "best-time-to-buy-and-sell-stock": "technical-buy-sell-stock",
  "maximum-subarray": "technical-maximum-subarray",
  "product-of-array-except-self": "technical-product-except-self",
  "number-of-islands": "technical-number-of-islands",
  "coin-change": "technical-coin-change",
  "find-minimum-in-rotated-sorted-array": "technical-find-min-rotated",
  "trapping-rain-water": "technical-trapping-rain-water",
};

type LcProblem = {
  frontendQuestionId: string;
  title: string;
  titleSlug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  paidOnly: boolean;
  topicTags: Array<{ name: string }>;
};

type RoundType = Scenario["category"];
type LcDifficulty = "Easy" | "Medium" | "Hard";

// ── Static group definitions ──────────────────────────────────────────────────

// Technical: one entry per interview format
const TECH_TYPES = [
  {
    id: "leetcode",
    label: "LeetCode Problems",
    description:
      "Classic coding problems with a live AI interviewer watching your editor in real time.",
    icon: Code2,
  },
  {
    id: "quant",
    label: "Quant Problems",
    description:
      "Probability, strategy, and discrete-math interview puzzles with a live interviewer and scratchpad.",
    icon: Braces,
  },
];

// Behavioral: TYPE cards (top-level) + competency groups (sub-groups within STAR)
const BEHAVIORAL_TYPES = [
  {
    id: "star-interview",
    label: "STAR Interview",
    description:
      "Structured behavioral scenarios — leadership, conflict, strategy, and more — using the STAR framework.",
    icon: Users,
  },
  {
    id: "lc-behavioral",
    label: "LeetCode Discussion",
    description:
      "Discuss a LeetCode problem verbally — walk through your thinking, tradeoffs, and approach without writing code.",
    icon: Code2,
  },
];

const STAR_GROUPS = [
  {
    id: "leadership",
    label: "Leadership & Influence",
    description:
      "Self-advocacy, driving decisions under pressure, and leading without formal authority.",
    scenarioIds: [
      "staff-swe-story",
      "staff-swe-incident",
      "staff-swe-missed-commitment",
    ],
  },
  {
    id: "people-teams",
    label: "People & Teams",
    description:
      "Mentorship, conflict resolution, and navigating difficult stakeholder dynamics.",
    scenarioIds: [
      "staff-swe-mentorship",
      "staff-swe-conflict",
      "staff-swe-technical-disagreement",
      "pm-stakeholder-pushback",
      "consulting-client-pushback",
    ],
  },
  {
    id: "strategy",
    label: "Strategy & Execution",
    description:
      "Ambiguous charters, roadmap prioritization, platform bets, and operational turnarounds.",
    scenarioIds: [
      "staff-swe-tech-strategy",
      "staff-swe-ambiguous-initiative",
      "staff-swe-migration-rollout",
      "staff-swe-quality-reset",
      "pm-prioritization",
      "pm-launch-decision",
      "consulting-ops-turnaround",
    ],
  },
  {
    id: "metrics",
    label: "Metrics & Analysis",
    description:
      "Diagnosing metric drops, structuring analysis, and communicating data-driven decisions.",
    scenarioIds: ["pm-metric-drop"],
  },
  {
    id: "product-sense",
    label: "Product Sense",
    description: "Improving existing products and making zero-to-one bets.",
    scenarioIds: ["pm-product-sense", "pm-zero-to-one"],
  },
  {
    id: "case-frameworks",
    label: "Case Frameworks",
    description:
      "Market sizing, profitability trees, market entry, and synthesis rounds.",
    scenarioIds: [
      "consulting-market-sizing",
      "consulting-profitability",
      "consulting-market-entry",
      "consulting-synthesis",
    ],
  },
];

// System design: TYPE cards (top-level) + domain groups (sub-groups within Architecture)
const SYSTEM_DESIGN_TYPES = [
  {
    id: "architecture",
    label: "Architecture Challenges",
    description:
      "Design real systems end-to-end — storage, APIs, realtime, and data pipelines with live whiteboard.",
    icon: Network,
  },
  {
    id: "lc-system-design",
    label: "LeetCode Architecture",
    description:
      "Use a LeetCode problem as a jumping-off point to discuss system-level design, scaling, and architecture.",
    icon: Code2,
  },
];

const ARCHITECTURE_GROUPS = [
  {
    id: "past-work",
    label: "Past Work Review",
    description:
      "Walk through a real system you designed — requirements, tradeoffs, and hindsight.",
    scenarioIds: ["staff-swe-system-design-intro"],
  },
  {
    id: "storage-apis",
    label: "Storage & APIs",
    description: "URL shorteners, key-value stores, and read-heavy API services.",
    scenarioIds: ["system-url-shortener", "system-resume-ingestion"],
  },
  {
    id: "platform-tooling",
    label: "Platform & Tooling",
    description: "Internal platforms, feature flag systems, and developer tooling.",
    scenarioIds: ["system-feature-flags", "system-ai-grading-pipeline"],
  },
  {
    id: "realtime",
    label: "Realtime & Messaging",
    description: "Chat systems, notification pipelines, and event-driven architectures.",
    scenarioIds: [
      "system-realtime-chat",
      "system-live-interview-platform",
      "system-collaborative-editor",
    ],
  },
  {
    id: "data-systems",
    label: "Data & Ranking",
    description: "News feeds, recommendation engines, and personalization systems.",
    scenarioIds: ["system-news-feed-ranking"],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROUND_ORDER: RoundType[] = ["behavioral", "technical", "system-design"];

const ROUND_META: Record<RoundType, { label: string; icon: typeof Braces }> = {
  technical: { label: "Technical", icon: Braces },
  behavioral: { label: "Behavioral", icon: Users },
  "system-design": { label: "System Design", icon: Network },
};

function getLcPracticeHref(slug: string, selectedType: string | null) {
  if (selectedType === "lc-behavioral") {
    return `/practice/lc/${slug}?mode=behavioral`;
  }
  if (selectedType === "lc-system-design") {
    return `/practice/lc/${slug}?mode=system-design`;
  }

  const prebuilt = PREBUILT_SLUG_TO_SCENARIO[slug];
  return prebuilt ? `/practice/${prebuilt}` : `/practice/lc/${slug}`;
}

const diffColor: Record<LcDifficulty, string> = {
  Easy: "text-emerald-500",
  Medium: "text-amber-500",
  Hard: "text-red-500",
};

function LeetCodeTableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            "grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_5.5rem_3rem] items-center gap-3 pl-4 pr-6 py-3",
            idx < 5 && "border-b border-base-300/50",
          )}
        >
          <div className="h-3 rounded-none bg-base-300/60" />
          <div className="space-y-2">
            <div className="h-3.5 w-3/4 rounded-none bg-base-300/60" />
            <div className="h-3 w-1/3 rounded-none bg-base-300/40" />
          </div>
          <div className="h-3 rounded-none bg-base-300/50" />
          <div className="h-3 rounded-none bg-base-300/50" />
          <div className="ml-auto h-4 w-4 rounded-none bg-base-300/40" />
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PracticePage() {
  const router = useRouter();
  const [activeRound, setActiveRound] = useState<RoundType>("behavioral");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubGroup, setSelectedSubGroup] = useState<string | null>(null);
  const [activeDiff, setActiveDiff] = useState<LcDifficulty | "All">("All");
  const [lcSearch, setLcSearch] = useState("");
  const [lcSearchDebounced, setLcSearchDebounced] = useState("");
  const [activeQuantCategory, setActiveQuantCategory] = useState<string>("All");
  const [quantSearch, setQuantSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setLcSearchDebounced(lcSearch), 350);
    return () => clearTimeout(t);
  }, [lcSearch]);

  // Whether the current drill-down is showing a LeetCode problem list
  const isLcDrillDown =
    selectedType === "leetcode" ||
    selectedType === "lc-behavioral" ||
    selectedType === "lc-system-design";
  const isQuantDrillDown = selectedType === "quant";

  // LeetCode API state
  const [lcProblems, setLcProblems] = useState<LcProblem[]>([]);
  const [lcTotal, setLcTotal] = useState(0);
  const [lcLoading, setLcLoading] = useState(false);
  const [lcError, setLcError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [favoritesEnabled, setFavoritesEnabled] = useState(true);
  const [favoriteSavingId, setFavoriteSavingId] = useState<string | null>(null);

  function switchRound(round: RoundType) {
    setActiveRound(round);
    setSelectedType(null);
    setSelectedSubGroup(null);
    setActiveDiff("All");
    setLcSearch("");
    setLcSearchDebounced("");
    setLcProblems([]);
    setActiveQuantCategory("All");
    setQuantSearch("");
  }

  function selectType(id: string) {
    setSelectedType(id);
    setSelectedSubGroup(null);
    setActiveDiff("All");
    setLcSearch("");
    setLcSearchDebounced("");
    setLcProblems([]);
    setActiveQuantCategory("All");
    setQuantSearch("");
  }

  function selectSubGroup(id: string) {
    setSelectedSubGroup(id);
  }

  function goBack() {
    if (selectedSubGroup) {
      setSelectedSubGroup(null);
    } else {
      setSelectedType(null);
      setActiveDiff("All");
      setLcProblems([]);
      setActiveQuantCategory("All");
      setQuantSearch("");
    }
  }

  type LcApiResponse = { error?: string; questions?: LcProblem[]; total?: number };
  type FavoriteApiResponse = { error?: string; favorites?: FavoriteItem[]; isFavorited?: boolean };

  useEffect(() => {
    let cancelled = false;

    fetch("/api/user/favorites")
      .then(async (response) => {
        if (response.status === 401) {
          if (!cancelled) {
            setFavoritesEnabled(false);
            setFavoritesReady(true);
          }
          return null;
        }

        const data = (await response.json()) as FavoriteApiResponse;
        if (!response.ok || data.error) {
          throw new Error(data.error ?? "Failed to load favorites");
        }

        if (!cancelled) {
          setFavorites(data.favorites ?? []);
          setFavoritesEnabled(true);
          setFavoritesReady(true);
        }

        return null;
      })
      .catch(() => {
        if (!cancelled) {
          setFavoritesEnabled(false);
          setFavoritesReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch LeetCode problems when entering any LeetCode drill-down
  useEffect(() => {
    if (!isLcDrillDown) return;
    setLcLoading(true);
    setLcError(null);
    const diff = activeDiff === "All" ? "" : activeDiff;
    const searchParam = lcSearchDebounced ? `&search=${encodeURIComponent(lcSearchDebounced)}` : "";
    fetch(`/api/leetcode/problems?difficulty=${diff}&limit=50&skip=0${searchParam}`)
      .then((r) => r.json() as Promise<LcApiResponse>)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setLcProblems(data.questions ?? []);
        setLcTotal(data.total ?? 0);
      })
      .catch((e: Error) => setLcError(e.message ?? "Failed to load problems"))
      .finally(() => setLcLoading(false));
  }, [isLcDrillDown, activeDiff, lcSearchDebounced]);

  function loadMore() {
    if (lcLoading) return;
    setLcLoading(true);
    const diff = activeDiff === "All" ? "" : activeDiff;
    const searchParam = lcSearchDebounced ? `&search=${encodeURIComponent(lcSearchDebounced)}` : "";
    fetch(`/api/leetcode/problems?difficulty=${diff}&limit=50&skip=${lcProblems.length}${searchParam}`)
      .then((r) => r.json() as Promise<LcApiResponse>)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setLcProblems((prev) => [...prev, ...(data.questions ?? [])]);
      })
      .catch((e: Error) => setLcError(e.message ?? "Failed to load more"))
      .finally(() => setLcLoading(false));
  }

  function openLcProblem(slug: string) {
    router.push(getLcPracticeHref(slug, selectedType));
  }

  function pickRandomLc() {
    const pool = lcProblems.filter((p) => !p.paidOnly);
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    openLcProblem(pick.titleSlug);
  }

  const filteredQuantProblems = useMemo(() => {
    const normalizedSearch = quantSearch.trim().toLowerCase();
    return quantProblems.filter((problem) => {
      const matchesCategory =
        activeQuantCategory === "All" || problem.categoryLabel === activeQuantCategory;
      if (!matchesCategory) return false;
      if (!normalizedSearch) return true;

      return (
        problem.title.toLowerCase().includes(normalizedSearch) ||
        problem.categoryLabel.toLowerCase().includes(normalizedSearch) ||
        problem.prompt.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [activeQuantCategory, quantSearch]);

  function openQuantProblem(slug: string) {
    router.push(`/practice/quant/${slug}`);
  }

  function pickRandomQuant() {
    if (filteredQuantProblems.length === 0) return;
    const pick =
      filteredQuantProblems[Math.floor(Math.random() * filteredQuantProblems.length)]!;
    openQuantProblem(pick.slug);
  }

  // Scenarios in the selected sub-group (for STAR / Architecture drill-down)
  const filteredSubGroup = useMemo(() => {
    if (!selectedSubGroup) return [];
    const groups =
      selectedType === "star-interview" ? STAR_GROUPS : ARCHITECTURE_GROUPS;
    const group = groups.find((g) => g.id === selectedSubGroup);
    if (!group) return [];
    return scenarios.filter((s) => group.scenarioIds.includes(s.id));
  }, [selectedSubGroup, selectedType]);

  function pickRandomScenario() {
    if (filteredSubGroup.length === 0) return;
    router.push(`/practice/${filteredSubGroup[Math.floor(Math.random() * filteredSubGroup.length)].id}`);
  }

  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.id)),
    [favorites],
  );

  async function toggleFavorite(item: FavoriteItem) {
    if (!favoritesEnabled) {
      return;
    }

    setFavoriteSavingId(item.id);

    try {
      const response = await fetch("/api/user/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item }),
      });
      const data = (await response.json()) as FavoriteApiResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Failed to update favorites");
      }

      setFavorites(data.favorites ?? []);
    } catch {
      // Best-effort only for now.
    } finally {
      setFavoriteSavingId(null);
    }
  }

  // Breadcrumb label
  const breadcrumbParts = useMemo(() => {
    const parts: string[] = [];
    if (!selectedType) return parts;

    // Find type label
    const allTypes = [
      ...TECH_TYPES,
      ...BEHAVIORAL_TYPES,
      ...SYSTEM_DESIGN_TYPES,
    ];
    const typeLabel = allTypes.find((t) => t.id === selectedType)?.label ?? "";
    parts.push(typeLabel);

    if (selectedSubGroup) {
      const groups =
        selectedType === "star-interview" ? STAR_GROUPS : ARCHITECTURE_GROUPS;
      const groupLabel = groups.find((g) => g.id === selectedSubGroup)?.label ?? "";
      parts.push(groupLabel);
    }
    return parts;
  }, [selectedType, selectedSubGroup]);

  // ── Determine what the current "level" is ─────────────────────────────────
  // Level 1: no selectedType — show type cards
  // Level 2: selectedType set, no selectedSubGroup — show either problem list or sub-group cards
  // Level 3: selectedSubGroup set — show scenario list (STAR / Architecture only)
  const level = !selectedType ? 1 : selectedSubGroup ? 3 : 2;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8 md:px-10 md:py-10">
      {/* Round tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {ROUND_ORDER.map((round) => {
          const { label, icon: Icon } = ROUND_META[round];
          return (
            <button
              key={round}
              type="button"
              onClick={() => switchRound(round)}
              className={cn(
                "btn btn-sm gap-2",
                activeRound === round
                  ? "border-0 bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border border-base-300 bg-transparent text-base-content/60 hover:bg-base-200 hover:text-base-content",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          );
        })}
      </div>

      {favoritesEnabled && favoritesReady && favorites.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-base-content">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              Favorites
            </div>
            <span className="text-xs text-base-content/50">
              {favorites.length} saved
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="flex items-start gap-3 rounded-none border border-base-300 bg-base-100 p-4"
              >
                <button
                  type="button"
                  onClick={() => router.push(favorite.href)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-medium text-base-content">
                    {favorite.title}
                  </p>
                  {favorite.subtitle && (
                    <p className="mt-1 truncate text-xs text-base-content/50">
                      {favorite.subtitle}
                    </p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(favorite)}
                  disabled={favoriteSavingId === favorite.id}
                  className="text-amber-400 transition hover:text-amber-500 disabled:opacity-50"
                  title="Remove favorite"
                >
                  <Star className="size-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Level 1: type cards ───────────────────────────────────────────────── */}
      {level === 1 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeRound === "technical" &&
            TECH_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => selectType(type.id)}
                  className="group flex flex-col gap-3 rounded-none border border-base-300 bg-base-100 p-5 text-left transition hover:border-indigo-400 hover:bg-base-200/40"
                >
                  <div className="flex items-start">
                    <div className="flex size-9 items-center justify-center rounded-none bg-indigo-100 text-indigo-600">
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-base-content">{type.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-base-content/60">
                      {type.description}
                    </p>
                  </div>
                </button>
              );
            })}

          {activeRound === "behavioral" &&
            BEHAVIORAL_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => selectType(type.id)}
                  className="group flex flex-col gap-3 rounded-none border border-base-300 bg-base-100 p-5 text-left transition hover:border-indigo-400 hover:bg-base-200/40"
                >
                  <div className="flex items-start">
                    <div className="flex size-9 items-center justify-center rounded-none bg-indigo-100 text-indigo-600">
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-base-content">{type.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-base-content/60">
                      {type.description}
                    </p>
                  </div>
                </button>
              );
            })}

          {activeRound === "system-design" &&
            SYSTEM_DESIGN_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => selectType(type.id)}
                  className="group flex flex-col gap-3 rounded-none border border-base-300 bg-base-100 p-5 text-left transition hover:border-indigo-400 hover:bg-base-200/40"
                >
                  <div className="flex items-start">
                    <div className="flex size-9 items-center justify-center rounded-none bg-indigo-100 text-indigo-600">
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-base-content">{type.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-base-content/60">
                      {type.description}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>
      )}

      {/* ── Level 2+: drill-down ─────────────────────────────────────────────── */}
      {level >= 2 && (
        <div className="space-y-4">
          {/* Breadcrumb + back */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-base-content/60 transition hover:text-base-content"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
            {breadcrumbParts.map((part, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-base-content/30">/</span>
                <span className="text-sm font-medium text-base-content">{part}</span>
              </span>
            ))}
          </div>

          {/* ── Quant problem list */}
          {isQuantDrillDown && (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search quant problems…"
                  value={quantSearch}
                  onChange={(e) => setQuantSearch(e.target.value)}
                  className="input input-bordered w-full pl-9 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {quantProblemCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveQuantCategory(category)}
                    className={cn(
                      "rounded-none border px-3 py-1.5 text-xs font-medium transition",
                      activeQuantCategory === category
                        ? "border-base-content/40 bg-base-200 text-base-content"
                        : "border-base-300 bg-transparent text-base-content/60 hover:border-base-content/30 hover:text-base-content",
                    )}
                  >
                    {category}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={pickRandomQuant}
                  disabled={filteredQuantProblems.length === 0}
                  className="btn btn-sm btn-ghost ml-auto gap-1.5"
                >
                  <Shuffle className="size-3.5" />
                  Random
                </button>
              </div>

              <div className="card card-bordered overflow-hidden bg-base-100">
                <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_7rem_5.5rem_3rem] items-center gap-3 border-b border-base-300 pl-4 pr-6 py-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-base-content/50">
                  <span>#</span>
                  <span>Problem</span>
                  <span className="justify-self-center">Category</span>
                  <span className="justify-self-center">Duration</span>
                  <span />
                </div>
                {filteredQuantProblems.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-base-content/50">
                    No quant problems found.
                  </div>
                ) : (
                  filteredQuantProblems.map((problem, idx) => {
                    const favorite: FavoriteItem = {
                      id: `quant:${problem.slug}`,
                      kind: "quant",
                      title: problem.title,
                      href: `/practice/quant/${problem.slug}`,
                      subtitle: problem.categoryLabel,
                    };

                    return (
                      <div
                        key={problem.slug}
                        className={cn(
                          "grid grid-cols-[2.5rem_minmax(0,1fr)_7rem_5.5rem_3rem] items-center gap-3 pl-4 pr-6 py-3 text-sm transition hover:bg-base-200/50",
                          idx < filteredQuantProblems.length - 1 &&
                            "border-b border-base-300/50",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => openQuantProblem(problem.slug)}
                          className="contents"
                        >
                          <span className="text-center text-xs text-base-content/40">
                            {problem.order}
                          </span>
                          <div className="min-w-0 text-left">
                            <p className="truncate font-medium text-base-content">
                              {problem.title}
                            </p>
                            <p className="truncate text-[11px] text-base-content/50">
                              BrainStellar
                            </p>
                          </div>
                          <span className="truncate justify-self-center text-xs text-base-content/60">
                            {problem.categoryLabel}
                          </span>
                          <span className="justify-self-center text-xs text-base-content/50">
                            {problem.duration}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(favorite)}
                          disabled={!favoritesEnabled || favoriteSavingId === favorite.id}
                          className="justify-self-center text-base-content/30 transition hover:text-amber-400 disabled:opacity-40"
                          title={favoriteIds.has(favorite.id) ? "Remove favorite" : "Add favorite"}
                        >
                          <Star
                            className={cn(
                              "size-4",
                              favoriteIds.has(favorite.id) &&
                                "fill-amber-400 text-amber-400",
                            )}
                          />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* ── LeetCode problem list (used by technical, behavioral, system-design) */}
          {isLcDrillDown && (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search problems…"
                  value={lcSearch}
                  onChange={(e) => setLcSearch(e.target.value)}
                  className="input input-bordered w-full pl-9 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["All", "Easy", "Medium", "Hard"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setActiveDiff(d)}
                    className={cn(
                      "rounded-none border px-3 py-1.5 text-xs font-medium transition",
                      activeDiff === d
                        ? d === "All"
                          ? "border-base-content/40 bg-base-200 text-base-content"
                          : cn("border-current bg-current/5", diffColor[d])
                        : "border-base-300 bg-transparent text-base-content/60 hover:border-base-content/30 hover:text-base-content",
                    )}
                  >
                    {d}
                  </button>
                ))}
                {lcLoading && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-base-content/50">
                    <Loader2 className="size-3.5 animate-spin" />
                    Loading
                  </div>
                )}
                <span className="ml-auto text-xs text-base-content/60">
                  {lcTotal > 0
                    ? lcProblems.length < lcTotal
                      ? `Showing ${lcProblems.length} of ${lcTotal} problems`
                      : `${lcTotal} problems`
                    : lcLoading
                      ? "Loading count..."
                      : "0 problems"}
                </span>
                <button
                  type="button"
                  onClick={pickRandomLc}
                  disabled={lcProblems.filter((p) => !p.paidOnly).length === 0}
                  className="btn btn-sm btn-ghost gap-1.5"
                >
                  <Shuffle className="size-3.5" />
                  Random
                </button>
              </div>

              <div className="card card-bordered overflow-hidden bg-base-100">
                <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_5.5rem_3rem] items-center gap-3 border-b border-base-300 pl-4 pr-6 py-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-base-content/50">
                  <span>#</span>
                  <span>Problem</span>
                  <span className="justify-self-center">Topic</span>
                  <span className="justify-self-center">Difficulty</span>
                  <span />
                </div>
                {lcError && (
                  <div className="px-4 py-6 text-center text-sm text-red-500">{lcError}</div>
                )}
                {lcLoading && lcProblems.length === 0 && (
                  <LeetCodeTableSkeleton />
                )}
                {!lcLoading && !lcError && lcProblems.length === 0 && (
                  <div className="px-4 py-10 text-center text-sm text-base-content/50">
                    No problems found.
                  </div>
                )}
                {lcProblems.map((problem, idx) => {
                  const topic = problem.topicTags[0]?.name ?? "—";
                  const d = problem.difficulty;
                  const favorite: FavoriteItem = {
                    id: `${selectedType ?? "leetcode"}:${problem.titleSlug}`,
                    kind: "leetcode",
                    title: problem.title,
                    href: getLcPracticeHref(problem.titleSlug, selectedType),
                    subtitle:
                      selectedType === "lc-behavioral"
                        ? `LeetCode Discussion · ${problem.difficulty}`
                        : selectedType === "lc-system-design"
                          ? `LeetCode Architecture · ${problem.difficulty}`
                          : `LeetCode Problems · ${problem.difficulty}`,
                  };
                  return (
                    <div
                      key={problem.titleSlug}
                      className={cn(
                        "grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_5.5rem_3rem] items-center gap-3 pl-4 pr-6 py-3 text-sm transition hover:bg-base-200/50",
                        idx < lcProblems.length - 1 && "border-b border-base-300/50",
                        problem.paidOnly && "opacity-40",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => openLcProblem(problem.titleSlug)}
                        disabled={problem.paidOnly}
                        className="contents disabled:cursor-not-allowed"
                      >
                        <span className="text-center text-xs text-base-content/40">
                          {problem.frontendQuestionId}
                        </span>
                        <div className="min-w-0 text-left">
                          <p className="truncate font-medium text-base-content">{problem.title}</p>
                          {problem.paidOnly && (
                            <p className="text-[11px] text-amber-500">Premium</p>
                          )}
                        </div>
                        <span className="truncate justify-self-center text-xs text-base-content/60">{topic}</span>
                        <span className={cn("justify-self-center text-xs font-medium", diffColor[d])}>{d}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(favorite)}
                        disabled={!favoritesEnabled || favoriteSavingId === favorite.id}
                        className="justify-self-center text-base-content/30 transition hover:text-amber-400 disabled:opacity-40"
                        title={favoriteIds.has(favorite.id) ? "Remove favorite" : "Add favorite"}
                      >
                        <Star className={cn("size-4", favoriteIds.has(favorite.id) && "fill-amber-400 text-amber-400")} />
                      </button>
                    </div>
                  );
                })}
                {!lcLoading && lcProblems.length > 0 && lcProblems.length < lcTotal && (
                  <button
                    type="button"
                    onClick={loadMore}
                    className="w-full py-3 text-center text-xs text-base-content/50 transition hover:text-base-content"
                  >
                    Load more
                  </button>
                )}
                {lcLoading && lcProblems.length > 0 && (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs text-base-content/50">
                    <Loader2 className="size-3.5 animate-spin" />
                    Loading…
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Sub-group cards (STAR Interview / Architecture Challenges) ─────── */}
          {!isLcDrillDown && !isQuantDrillDown && !selectedSubGroup && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(selectedType === "star-interview"
                ? STAR_GROUPS
                : ARCHITECTURE_GROUPS
              ).map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => selectSubGroup(group.id)}
                  className="group flex flex-col gap-3 rounded-none border border-base-300 bg-base-100 p-5 text-left transition hover:border-indigo-400 hover:bg-base-200/40"
                >
                  <div className="flex items-start justify-between">
                    <span className="rounded-none bg-base-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-base-content/60">
                      {group.scenarioIds.length}{" "}
                      {group.scenarioIds.length === 1 ? "scenario" : "scenarios"}
                    </span>
                    <ChevronRight className="size-4 text-base-content/30 transition group-hover:translate-x-0.5 group-hover:text-base-content/60" />
                  </div>
                  <div>
                    <p className="font-semibold text-base-content">{group.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-base-content/60">
                      {group.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── Scenario list (Level 3 — inside a sub-group) ─────────────────── */}
          {selectedSubGroup && (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={pickRandomScenario}
                  disabled={filteredSubGroup.length === 0}
                  className="btn btn-sm btn-ghost gap-1.5"
                >
                  <Shuffle className="size-3.5" />
                  Random
                </button>
              </div>
              <div className="card card-bordered overflow-hidden bg-base-100">
                <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_3rem] items-center gap-3 border-b border-base-300 pl-4 pr-6 py-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-base-content/50">
                  <span>Scenario</span>
                  <span className="justify-self-center">Duration</span>
                  <span />
                </div>
                {filteredSubGroup.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-base-content/50">
                    No scenarios in this group.
                  </div>
                ) : (
                  filteredSubGroup.map((scenario, idx) => {
                    const favorite: FavoriteItem = {
                      id: `scenario:${scenario.id}`,
                      kind: "scenario",
                      title: scenario.title,
                      href: `/practice/${scenario.id}`,
                      subtitle: scenario.interviewer,
                    };

                    return (
                      <div
                        key={scenario.id}
                        className={cn(
                          "grid grid-cols-[minmax(0,1fr)_5.5rem_3rem] items-center gap-3 pl-4 pr-6 py-3 text-sm transition hover:bg-base-200/50",
                          idx < filteredSubGroup.length - 1 && "border-b border-base-300/50",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => router.push(`/practice/${scenario.id}`)}
                          className="contents"
                        >
                          <div className="min-w-0 text-left">
                            <p className="truncate font-medium text-base-content">{scenario.title}</p>
                            <p className="truncate text-[11px] text-base-content/50">
                              {scenario.interviewer}
                            </p>
                          </div>
                          <span className="justify-self-center text-xs text-base-content/50">{scenario.duration}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(favorite)}
                          disabled={!favoritesEnabled || favoriteSavingId === favorite.id}
                          className="justify-self-center text-base-content/30 transition hover:text-amber-400 disabled:opacity-40"
                          title={favoriteIds.has(favorite.id) ? "Remove favorite" : "Add favorite"}
                        >
                          <Star className={cn("size-4", favoriteIds.has(favorite.id) && "fill-amber-400 text-amber-400")} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
