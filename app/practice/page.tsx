import Link from "next/link";
import { Circle, Search } from "lucide-react";
import { MainShell } from "@/components/app/main-shell";
import { scenarios } from "@/data/scenarios";
import { Input } from "@/components/ui/input";

const categories = [
  {
    id: "behavioral",
    name: "Behavioral",
    description: "STAR method, leadership, conflict resolution, and teamwork scenarios.",
    scenarios: ["staff-swe-story", "staff-swe-conflict"],
  },
  {
    id: "technical",
    name: "Technical",
    description: "Data structures, algorithms, system architecture, and coding approach.",
    scenarios: ["staff-swe-story"],
  },
  {
    id: "system-design",
    name: "System Design",
    description: "Scalability, tradeoffs, component design, and infrastructure decisions.",
    scenarios: ["staff-swe-conflict"],
  },
  {
    id: "product",
    name: "Product & Strategy",
    description: "Prioritization, product sense, metrics, and stakeholder communication.",
    scenarios: ["pm-prioritization"],
  },
  {
    id: "case-study",
    name: "Case Study",
    description: "Structured thinking, synthesis, recommendations, and executive communication.",
    scenarios: ["consulting-synthesis"],
  },
  {
    id: "general",
    name: "General",
    description: "Mixed question types to practice adapting across interview formats.",
    scenarios: ["staff-swe-story", "pm-prioritization", "consulting-synthesis"],
  },
];

const difficultyTextStyles: Record<
  (typeof scenarios)[number]["difficulty"],
  string
> = {
  Foundations: "text-emerald-600",
  Growth: "text-amber-500",
  Stretch: "text-red-500",
};

const difficultyLabels: Record<
  (typeof scenarios)[number]["difficulty"],
  string
> = {
  Foundations: "Easy",
  Growth: "Medium",
  Stretch: "Hard",
};

export default function PracticePage() {
  const scenarioById = new Map(scenarios.map((scenario, index) => [scenario.id, { scenario, index }]));

  return (
    <MainShell>
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 md:px-10 md:py-10">
        <div>
          <h1 className="text-4xl">Practice</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Work through interview scenarios in a list format. Pick any row to start a loop.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            readOnly
            value=""
            placeholder="Search scenarios"
            className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            aria-label="Search scenarios"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_7rem] items-center gap-3 border-b border-border px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="sr-only">Status</span>
            <span>Title</span>
            <span>Difficulty</span>
          </div>
          <ul className="divide-y divide-border">
            {categories.map((category) => {
              const categoryScenarios = category.scenarios
                .map((scenarioId) => scenarioById.get(scenarioId))
                .filter((entry): entry is { scenario: (typeof scenarios)[number]; index: number } => Boolean(entry));

              if (!categoryScenarios.length) {
                return null;
              }

              return (
                <li key={category.id}>
                  <div className="border-b border-border bg-muted/35 px-4 py-3">
                    <p className="text-sm">{category.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{category.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {categoryScenarios.length} {categoryScenarios.length === 1 ? "scenario" : "scenarios"}
                    </p>
                  </div>
                  <ul className="divide-y divide-border">
                    {categoryScenarios.map(({ scenario, index }) => (
                      <li key={`${category.id}-${scenario.id}`}>
                        <Link
                          href={`/practice/${scenario.id}`}
                          className="grid grid-cols-[1.75rem_minmax(0,1fr)_7rem] items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                        >
                          <span className="flex items-center justify-center">
                            <Circle className="size-4 text-muted-foreground" />
                          </span>
                          <span className="truncate">
                            {index + 1}. {scenario.title}
                          </span>
                          <span className={difficultyTextStyles[scenario.difficulty]}>
                            {difficultyLabels[scenario.difficulty]}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </MainShell>
  );
}
