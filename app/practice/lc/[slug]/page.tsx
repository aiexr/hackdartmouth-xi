"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PracticeSession } from "@/components/app/practice-session";
import type { Scenario } from "@/data/scenarios";

const AVATAR_MARCUS =
  "https://images.unsplash.com/photo-1762522927402-f390672558d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const AVATAR_SARAH =
  "https://images.unsplash.com/photo-1770058428154-9eee8a6a1fbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";

const INTERVIEWERS = [
  { name: "Marcus Rivera", role: "Senior Engineer", avatar: AVATAR_MARCUS },
  { name: "Sarah Chen", role: "Engineering Manager", avatar: AVATAR_SARAH },
];

type LcProblem = {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  content: string;
  hints: string[];
  topicTags: Array<{ name: string }>;
  exampleTestcaseList: string[];
  error?: string;
};

type LcScaffold = {
  optimalApproach?: string;
  starterCode?: string;
  functionName?: string;
  hints?: string[];
  rubric?: string[];
  followUps?: string[];
  error?: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<pre>[\s\S]*?<\/pre>/gi, (match) => match) // preserve pre blocks temporarily
    .replace(/<\/?(p|div|li|ul|ol|h[1-6])[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseExamples(plain: string) {
  const examples: Array<{ input: string; output: string; explanation?: string }> = [];
  const blocks = plain.split(/Example \d+:/i).slice(1);
  for (const block of blocks) {
    const inputMatch = block.match(/Input:\s*(.+?)(?=Output:|$)/si);
    const outputMatch = block.match(/Output:\s*(.+?)(?=Explanation:|Example|Constraints|$)/si);
    const explMatch = block.match(/Explanation:\s*(.+?)(?=Example|Constraints|$)/si);
    if (inputMatch && outputMatch) {
      examples.push({
        input: inputMatch[1].replace(/\s+/g, " ").trim(),
        output: outputMatch[1].replace(/\s+/g, " ").trim(),
        explanation: explMatch ? explMatch[1].replace(/\s+/g, " ").trim() : undefined,
      });
    }
    if (examples.length >= 3) break;
  }
  return examples;
}

function parseConstraints(plain: string): string[] {
  const match = plain.match(/Constraints?:([\s\S]+?)(?=Follow-up|Note:|$)/i);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((l) => l.replace(/^[\s•*-]+/, "").trim())
    .filter((l) => l.length > 0)
    .slice(0, 8);
}

function diffToScenarioDiff(d: string): Scenario["difficulty"] {
  if (d === "Easy") return "Foundations";
  if (d === "Medium") return "Growth";
  return "Stretch";
}

function ScenarioSetupSkeleton({ status }: { status: string }) {
  return (
    <div className="min-h-screen bg-base-200 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-none border border-border bg-base-100 px-3 py-2 text-sm text-base-content/70">
            <Loader2 className="size-4 animate-spin" />
            {status}
          </div>
          <div className="h-10 w-2/3 animate-pulse rounded-none bg-base-300/55" />
          <div className="h-4 w-1/2 animate-pulse rounded-none bg-base-300/40" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4 rounded-none border border-border bg-base-100 p-6">
            <div className="h-4 w-32 animate-pulse rounded-none bg-base-300/40" />
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded-none bg-base-300/45" />
              <div className="h-4 w-11/12 animate-pulse rounded-none bg-base-300/45" />
              <div className="h-4 w-4/5 animate-pulse rounded-none bg-base-300/45" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="space-y-2 rounded-none border border-base-300 p-4">
                  <div className="h-3 w-16 animate-pulse rounded-none bg-base-300/40" />
                  <div className="h-6 w-20 animate-pulse rounded-none bg-base-300/55" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-none border border-border bg-base-100 p-6">
            <div className="h-4 w-24 animate-pulse rounded-none bg-base-300/40" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-10 animate-pulse rounded-none bg-base-300/45" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LcPracticePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "technical") as Scenario["category"];
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [status, setStatus] = useState("Fetching problem…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 1. Fetch problem from LeetCode via our API proxy
        const problemRes = await fetch(`/api/leetcode/problem/${slug}`);
        const problem = await problemRes.json() as LcProblem;
        if (problem.error) throw new Error(problem.error);
        if (!problem.content) throw new Error("This problem is not publicly available.");

        if (cancelled) return;
        setStatus("Generating interview context…");

        const plain = stripHtml(problem.content);

        // 2. Generate interview scaffolding via LLM
        const scaffoldRes = await fetch("/api/leetcode/scenario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: problem.title,
            description: plain,
            difficulty: problem.difficulty,
            topicTags: (problem.topicTags as Array<{ name: string }>).map((t) => t.name),
          }),
        });
        const scaffold = await scaffoldRes.json() as LcScaffold;
        if (scaffold.error) throw new Error(scaffold.error);
        if (cancelled) return;

        const interviewer = INTERVIEWERS[Math.floor(Math.random() * INTERVIEWERS.length)]!;
        const examples = parseExamples(plain);
        const constraints = parseConstraints(plain);
        const duration =
          problem.difficulty === "Hard" ? "35 min" : problem.difficulty === "Medium" ? "25 min" : "20 min";

        const modeConfig = {
          technical: {
            prompt: "Solve this problem in the editor. Walk me through your approach before you write any code, then implement it and explain the complexity tradeoffs.",
            pattern: "leetcode",
            trackId: "technical",
            trackLabel: "Technical Coding",
          },
          behavioral: {
            prompt: "Let's discuss this problem verbally. Walk me through how you'd approach it, what tradeoffs you'd consider, and how you'd communicate your thought process to a team. No coding needed — focus on your reasoning and communication.",
            pattern: "leetcode-discussion",
            trackId: "behavioral",
            trackLabel: "Behavioral Discussion",
          },
          "system-design": {
            prompt: "Use this problem as a starting point to discuss system-level design. How would you architect a system around this? Consider scaling, data flow, storage, and tradeoffs. Use the whiteboard to sketch your design.",
            pattern: "leetcode-architecture",
            trackId: "system-design",
            trackLabel: "System Design",
          },
        }[mode] ?? {
          prompt: "Solve this problem in the editor.",
          pattern: "leetcode",
          trackId: "technical",
          trackLabel: "Technical Coding",
        };

        const built: Scenario = {
          id: `lc-${slug}`,
          title: problem.title,
          prompt: modeConfig.prompt,
          category: mode,
          pattern: modeConfig.pattern,
          trackId: modeConfig.trackId,
          trackLabel: modeConfig.trackLabel,
          difficulty: diffToScenarioDiff(problem.difficulty),
          interviewer: interviewer.name,
          interviewerRole: interviewer.role,
          interviewerAvatar: interviewer.avatar,
          mastery: 0,
          duration,
          focus: (problem.topicTags as Array<{ name: string }>).map((t) => t.name).slice(0, 4),
          hints: Array.isArray(scaffold.hints) ? scaffold.hints : [],
          rubric: Array.isArray(scaffold.rubric)
            ? scaffold.rubric
            : ["Correctness", "Complexity analysis", "Communication", "Code quality", "Edge cases"],
          followUps: Array.isArray(scaffold.followUps) ? scaffold.followUps : [],
          codingProblem: {
            source: "LeetCode",
            sourceId: problem.questionFrontendId,
            sourceTitle: problem.title,
            sourceSlug: problem.titleSlug,
            sourceDifficulty: problem.difficulty as "Easy" | "Medium" | "Hard",
            sourceUrl: `https://leetcode.com/problems/${problem.titleSlug}/`,
            topicTags: (problem.topicTags as Array<{ name: string }>).map((t) => t.name),
            sourceHints: Array.isArray(problem.hints) ? problem.hints : [],
            description: plain.slice(0, 2000),
            examples: examples.length > 0 ? examples : [{ input: "See problem statement", output: "—" }],
            constraints,
            optimalApproach: typeof scaffold.optimalApproach === "string" ? scaffold.optimalApproach : "",
            starterCode: typeof scaffold.starterCode === "string" ? scaffold.starterCode : "// Write your solution here.\n",
            functionName: typeof scaffold.functionName === "string" ? scaffold.functionName : undefined,
          },
        };

        setScenario(built);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug, mode]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200 px-6 text-center">
        <div className="max-w-sm space-y-2">
          <p className="font-medium text-base-content">Could not load this problem</p>
          <p className="text-sm text-base-content/60">{error}</p>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return <ScenarioSetupSkeleton status={status} />;
  }

  return <PracticeSession scenario={scenario} />;
}
