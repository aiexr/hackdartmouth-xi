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
  Shuffle,
  Users,
} from "lucide-react";
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

// Technical: one entry per interview format (only LeetCode for now)
const TECH_TYPES = [
  {
    id: "leetcode",
    label: "LeetCode Problems",
    description:
      "Classic coding problems with a live AI interviewer watching your editor in real time.",
    icon: Code2,
  },
];

// Behavioral: grouped by competency round
const BEHAVIORAL_GROUPS = [
  {
    id: "leadership",
    label: "Leadership & Influence",
    description:
      "Self-advocacy, driving decisions under pressure, and leading without formal authority.",
    scenarioIds: ["staff-swe-story", "staff-swe-incident"],
  },
  {
    id: "people-teams",
    label: "People & Teams",
    description:
      "Mentorship, conflict resolution, and navigating difficult stakeholder dynamics.",
    scenarioIds: [
      "staff-swe-mentorship",
      "staff-swe-conflict",
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

// System design: grouped by problem domain
const SYSTEM_DESIGN_GROUPS = [
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
    scenarioIds: ["system-url-shortener"],
  },
  {
    id: "platform-tooling",
    label: "Platform & Tooling",
    description: "Internal platforms, feature flag systems, and developer tooling.",
    scenarioIds: ["system-feature-flags"],
  },
  {
    id: "realtime",
    label: "Realtime & Messaging",
    description: "Chat systems, notification pipelines, and event-driven architectures.",
    scenarioIds: ["system-realtime-chat"],
  },
  {
    id: "data-systems",
    label: "Data & Ranking",
    description: "News feeds, recommendation engines, and personalization systems.",
    scenarioIds: ["system-news-feed-ranking"],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROUND_ORDER: RoundType[] = ["technical", "behavioral", "system-design"];

const ROUND_META: Record<RoundType, { label: string; icon: typeof Braces }> = {
  technical: { label: "Technical", icon: Braces },
  behavioral: { label: "Behavioral", icon: Users },
  "system-design": { label: "System Design", icon: Network },
};

function getLcDifficulty(scenario: Scenario): LcDifficulty {
  const src = scenario.codingProblem?.sourceDifficulty;
  if (src) return src;
  if (scenario.difficulty === "Foundations") return "Easy";
  if (scenario.difficulty === "Growth") return "Medium";
  return "Hard";
}

const diffColor: Record<LcDifficulty, string> = {
  Easy: "text-emerald-500",
  Medium: "text-amber-500",
  Hard: "text-red-500",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PracticePage() {
  const router = useRouter();
  const [activeRound, setActiveRound] = useState<RoundType>("technical");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [activeDiff, setActiveDiff] = useState<LcDifficulty | "All">("All");

  const isTechnical = activeRound === "technical";

  // LeetCode API state (only used when selectedGroup === "leetcode")
  const [lcProblems, setLcProblems] = useState<LcProblem[]>([]);
  const [lcTotal, setLcTotal] = useState(0);
  const [lcLoading, setLcLoading] = useState(false);
  const [lcError, setLcError] = useState<string | null>(null);

  function switchRound(round: RoundType) {
    setActiveRound(round);
    setSelectedGroup(null);
    setActiveDiff("All");
    setLcProblems([]);
  }

  function selectGroup(id: string) {
    setSelectedGroup(id);
    setActiveDiff("All");
    setLcProblems([]);
  }

  function goBack() {
    setSelectedGroup(null);
    setActiveDiff("All");
    setLcProblems([]);
  }

  type LcApiResponse = { error?: string; questions?: LcProblem[]; total?: number };

  // Fetch LeetCode problems when entering the drill-down
  useEffect(() => {
    if (selectedGroup !== "leetcode") return;
    setLcLoading(true);
    setLcError(null);
    const diff = activeDiff === "All" ? "" : activeDiff;
    fetch(`/api/leetcode/problems?difficulty=${diff}&limit=50&skip=0`)
      .then((r) => r.json() as Promise<LcApiResponse>)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setLcProblems(data.questions ?? []);
        setLcTotal(data.total ?? 0);
      })
      .catch((e: Error) => setLcError(e.message ?? "Failed to load problems"))
      .finally(() => setLcLoading(false));
  }, [selectedGroup, activeDiff]);

  function loadMore() {
    if (lcLoading) return;
    setLcLoading(true);
    const diff = activeDiff === "All" ? "" : activeDiff;
    fetch(`/api/leetcode/problems?difficulty=${diff}&limit=50&skip=${lcProblems.length}`)
      .then((r) => r.json() as Promise<LcApiResponse>)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setLcProblems((prev) => [...prev, ...(data.questions ?? [])]);
      })
      .catch((e: Error) => setLcError(e.message ?? "Failed to load more"))
      .finally(() => setLcLoading(false));
  }

  function openLcProblem(slug: string) {
    const prebuilt = PREBUILT_SLUG_TO_SCENARIO[slug];
    router.push(prebuilt ? `/practice/${prebuilt}` : `/practice/lc/${slug}`);
  }

  function pickRandomLc() {
    const pool = lcProblems.filter((p) => !p.paidOnly);
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    openLcProblem(pick.titleSlug);
  }

  // Round counts for tab badges
  const roundCounts = useMemo(
    () =>
      ROUND_ORDER.reduce(
        (acc, r) => {
          acc[r] = scenarios.filter((s) => s.category === r).length;
          return acc;
        },
        {} as Record<RoundType, number>,
      ),
    [],
  );

  // All technical scenarios
  const technicalScenarios = useMemo(
    () => scenarios.filter((s) => s.category === "technical"),
    [],
  );

  // Difficulty breakdown for the LeetCode card
  const techDiffCounts = useMemo(() => {
    const counts: Record<LcDifficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
    for (const s of technicalScenarios) counts[getLcDifficulty(s)]++;
    return counts;
  }, [technicalScenarios]);

  // Technical drill-down: filter by selected difficulty
  const filteredTech = useMemo(() => {
    if (!isTechnical || selectedGroup !== "leetcode") return [];
    return technicalScenarios.filter(
      (s) => activeDiff === "All" || getLcDifficulty(s) === activeDiff,
    );
  }, [isTechnical, selectedGroup, activeDiff, technicalScenarios]);

  // Behavioral / system-design drill-down: scenarios in selected group
  const filteredGroup = useMemo(() => {
    if (!selectedGroup || isTechnical) return [];
    const groups =
      activeRound === "behavioral" ? BEHAVIORAL_GROUPS : SYSTEM_DESIGN_GROUPS;
    const group = groups.find((g) => g.id === selectedGroup);
    if (!group) return [];
    return scenarios.filter((s) => group.scenarioIds.includes(s.id));
  }, [selectedGroup, isTechnical, activeRound]);

  function pickRandom() {
    const pool = isTechnical ? filteredTech : filteredGroup;
    if (pool.length === 0) return;
    router.push(`/practice/${pool[Math.floor(Math.random() * pool.length)].id}`);
  }

  // Label for the breadcrumb
  const selectedLabel = useMemo(() => {
    if (!selectedGroup) return "";
    if (isTechnical) return TECH_TYPES.find((t) => t.id === selectedGroup)?.label ?? "";
    const groups =
      activeRound === "behavioral" ? BEHAVIORAL_GROUPS : SYSTEM_DESIGN_GROUPS;
    return groups.find((g) => g.id === selectedGroup)?.label ?? "";
  }, [selectedGroup, isTechnical, activeRound]);

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
              <span className="text-[0.65rem] text-base-content/50">
                {roundCounts[round]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Level 1: type cards ───────────────────────────────────────────────── */}
      {!selectedGroup && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isTechnical &&
            TECH_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => selectGroup(type.id)}
                  className="group flex flex-col gap-3 rounded-none border border-base-300 bg-base-100 p-5 text-left transition hover:border-indigo-400 hover:bg-base-200/40"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-none bg-indigo-100 text-indigo-600">
                      <Icon className="size-5" />
                    </div>
                    <ChevronRight className="size-4 text-base-content/30 transition group-hover:translate-x-0.5 group-hover:text-base-content/60" />
                  </div>
                  <div>
                    <p className="font-semibold text-base-content">{type.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-base-content/60">
                      {type.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={cn("font-medium", diffColor.Easy)}>
                      {techDiffCounts.Easy} Easy
                    </span>
                    <span className={cn("font-medium", diffColor.Medium)}>
                      {techDiffCounts.Medium} Medium
                    </span>
                    <span className={cn("font-medium", diffColor.Hard)}>
                      {techDiffCounts.Hard} Hard
                    </span>
                  </div>
                </button>
              );
            })}

          {activeRound === "behavioral" &&
            BEHAVIORAL_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => selectGroup(group.id)}
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

          {activeRound === "system-design" &&
            SYSTEM_DESIGN_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => selectGroup(group.id)}
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

      {/* ── Level 2: drill-down ───────────────────────────────────────────────── */}
      {selectedGroup && (
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
            <span className="text-base-content/30">/</span>
            <span className="text-sm font-medium text-base-content">{selectedLabel}</span>
          </div>

          {/* Difficulty + Random — technical only */}
          {isTechnical && (
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
              <button
                type="button"
                onClick={pickRandomLc}
                disabled={lcProblems.filter((p) => !p.paidOnly).length === 0}
                className="btn btn-sm btn-ghost ml-auto gap-1.5"
              >
                <Shuffle className="size-3.5" />
                Random
              </button>
            </div>
          )}

          {!isTechnical && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={pickRandom}
                disabled={filteredGroup.length === 0}
                className="btn btn-sm btn-ghost gap-1.5"
              >
                <Shuffle className="size-3.5" />
                Random
              </button>
            </div>
          )}

          {/* Problem list — technical (from LeetCode API) */}
          {isTechnical && (
            <div className="card card-bordered overflow-hidden bg-base-100">
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_5rem_5.5rem] items-center gap-3 border-b border-base-300 px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-base-content/50">
                <span>#</span>
                <span>Problem</span>
                <span>Topic</span>
                <span>Difficulty</span>
              </div>
              {lcError && (
                <div className="px-4 py-6 text-center text-sm text-red-500">{lcError}</div>
              )}
              {lcLoading && lcProblems.length === 0 && (
                <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-base-content/50">
                  <Loader2 className="size-4 animate-spin" />
                  Loading problems…
                </div>
              )}
              {!lcLoading && !lcError && lcProblems.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-base-content/50">
                  No problems found.
                </div>
              )}
              {lcProblems.map((problem, idx) => {
                const topic = problem.topicTags[0]?.name ?? "—";
                const d = problem.difficulty;
                return (
                  <button
                    key={problem.titleSlug}
                    type="button"
                    onClick={() => openLcProblem(problem.titleSlug)}
                    disabled={problem.paidOnly}
                    className={cn(
                      "grid w-full cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)_5rem_5.5rem] items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-base-200/50 disabled:cursor-not-allowed disabled:opacity-40",
                      idx < lcProblems.length - 1 && "border-b border-base-300/50",
                    )}
                  >
                    <span className="text-center text-xs text-base-content/40">
                      {problem.frontendQuestionId}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-base-content">{problem.title}</p>
                      {problem.paidOnly && (
                        <p className="text-[11px] text-amber-500">Premium</p>
                      )}
                    </div>
                    <span className="truncate text-xs text-base-content/60">{topic}</span>
                    <span className={cn("text-xs font-medium", diffColor[d])}>{d}</span>
                  </button>
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
          )}

          {/* Scenario list — behavioral / system-design */}
          {!isTechnical && (
            <div className="card card-bordered overflow-hidden bg-base-100">
              <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-3 border-b border-base-300 px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-base-content/50">
                <span>Scenario</span>
                <span>Duration</span>
              </div>
              {filteredGroup.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-base-content/50">
                  No scenarios in this group.
                </div>
              ) : (
                filteredGroup.map((scenario, idx) => (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => router.push(`/practice/${scenario.id}`)}
                    className={cn(
                      "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-base-200/50",
                      idx < filteredGroup.length - 1 && "border-b border-base-300/50",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-base-content">{scenario.title}</p>
                      <p className="truncate text-[11px] text-base-content/50">
                        {scenario.interviewer}
                      </p>
                    </div>
                    <span className="text-xs text-base-content/50">{scenario.duration}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
