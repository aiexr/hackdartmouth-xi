import Link from "next/link";
import {
  Brain,
  Code2,
  MessageSquare,
  Network,
  Briefcase,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { MainShell } from "@/components/app/main-shell";
import { Card, CardContent } from "@/components/ui/card";
import { scenarios } from "@/data/scenarios";

const categories = [
  {
    id: "behavioral",
    name: "Behavioral",
    description: "STAR method, leadership, conflict resolution, and teamwork scenarios.",
    icon: MessageSquare,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    trackId: "staff-engineering",
    scenarios: ["staff-swe-story", "staff-swe-conflict"],
  },
  {
    id: "technical",
    name: "Technical",
    description: "Data structures, algorithms, system architecture, and coding approach.",
    icon: Code2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    trackId: "staff-engineering",
    scenarios: ["staff-swe-story"],
  },
  {
    id: "system-design",
    name: "System Design",
    description: "Scalability, tradeoffs, component design, and infrastructure decisions.",
    icon: Network,
    color: "text-sky-600",
    bg: "bg-sky-50",
    trackId: "staff-engineering",
    scenarios: ["staff-swe-conflict"],
  },
  {
    id: "product",
    name: "Product & Strategy",
    description: "Prioritization, product sense, metrics, and stakeholder communication.",
    icon: BarChart3,
    color: "text-violet-600",
    bg: "bg-violet-50",
    trackId: "product-management",
    scenarios: ["pm-prioritization"],
  },
  {
    id: "case-study",
    name: "Case Study",
    description: "Structured thinking, synthesis, recommendations, and executive communication.",
    icon: Briefcase,
    color: "text-amber-600",
    bg: "bg-amber-50",
    trackId: "consulting",
    scenarios: ["consulting-synthesis"],
  },
  {
    id: "general",
    name: "General",
    description: "Mixed question types to practice adapting across interview formats.",
    icon: Brain,
    color: "text-rose-600",
    bg: "bg-rose-50",
    trackId: "staff-engineering",
    scenarios: ["staff-swe-story", "pm-prioritization", "consulting-synthesis"],
  },
];

export default function PracticePage() {
  return (
    <MainShell>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <div>
          <h1 className="text-3xl">Practice</h1>
          <p className="mt-2 max-w-xl text-base text-muted-foreground">
            Choose an interview category to start a focused practice session.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const firstScenario = scenarios.find((s) =>
              cat.scenarios.includes(s.id),
            );
            const href = firstScenario
              ? `/practice/${firstScenario.id}`
              : `/practice/${scenarios[0].id}`;

            return (
              <Link key={cat.id} href={href}>
                <Card className="h-full transition hover:shadow-md hover:border-primary/30">
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex size-11 items-center justify-center rounded-xl ${cat.bg} ${cat.color}`}
                      >
                        <cat.icon className="size-5" />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{cat.name}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {cat.description}
                      </p>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {cat.scenarios.length} {cat.scenarios.length === 1 ? "scenario" : "scenarios"}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </MainShell>
  );
}
