"use client";

import { use, useMemo } from "react";
import { PracticeSession } from "@/components/app/practice-session";
import { quantProblemsBySlug } from "@/data/quant-problems";
import type { Scenario } from "@/data/scenarios";

const AVATAR_MARCUS =
  "https://images.unsplash.com/photo-1762522927402-f390672558d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const AVATAR_SARAH =
  "https://images.unsplash.com/photo-1770058428154-9eee8a6a1fbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";

const INTERVIEWERS = [
  { name: "Marcus Rivera", role: "Senior Engineer", avatar: AVATAR_MARCUS },
  { name: "Sarah Chen", role: "Engineering Manager", avatar: AVATAR_SARAH },
];

const FOLLOW_UPS_BY_CATEGORY: Record<string, string[]> = {
  probability: [
    "What assumptions are you making about independence, symmetry, or conditioning?",
    "How would you sanity-check the answer before committing to the algebra?",
  ],
  strategy: [
    "What happens in the smallest non-trivial version of this puzzle?",
    "What invariant or backward-induction step makes the result hold?",
  ],
  discrete: [
    "Is there a counting, parity, or invariant shortcut hiding here?",
    "What smaller case exposes the general pattern?",
  ],
  general: [
    "What hidden assumption in the wording matters most?",
    "How would you explain the key trick to someone seeing this for the first time?",
  ],
  dice: [
    "Can you model the state recursively instead of brute-forcing the space?",
    "What symmetry or expectation identity makes the setup simpler?",
  ],
};

export default function QuantPracticePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const problem = quantProblemsBySlug[slug];

  const scenario = useMemo<Scenario | null>(() => {
    if (!problem) return null;

    const interviewer = INTERVIEWERS[problem.order % INTERVIEWERS.length]!;
    const followUps = FOLLOW_UPS_BY_CATEGORY[problem.category] ?? FOLLOW_UPS_BY_CATEGORY.general;

    return {
      id: `quant-${problem.slug}`,
      title: problem.title,
      prompt:
        "Work through this quant problem out loud. Set up the problem carefully, state assumptions, and use the editor as a scratchpad only if it helps your reasoning.",
      category: "technical",
      pattern: `quant-${problem.slug}`,
      trackId: "technical",
      trackLabel: "Quant Reasoning",
      difficulty: problem.difficulty,
      interviewer: interviewer.name,
      interviewerRole: interviewer.role,
      interviewerAvatar: interviewer.avatar,
      mastery: 0,
      duration: problem.duration,
      focus: [problem.categoryLabel, "Structured reasoning", "Clear communication"],
      hints: problem.hint
        ? [
            "Start with the smallest tractable case before jumping to the full answer.",
            "State the governing assumption or invariant before you compute.",
            problem.hint,
          ]
        : [
            "Start with the smallest tractable case before jumping to the full answer.",
            "State the governing assumption or invariant before you compute.",
          ],
      rubric: [
        "Problem setup",
        "Reasoning clarity",
        "Use of assumptions",
        "Mathematical correctness",
        "Communication",
      ],
      followUps,
      codingProblem: {
        source: "BrainStellar",
        sourceTitle: problem.title,
        sourceSlug: problem.slug,
        sourceUrl: problem.sourceUrl,
        topicTags: ["Quant", problem.categoryLabel],
        sourceHints: problem.hint ? [problem.hint] : [],
        description: problem.prompt,
        examples: [],
        constraints: [
          `Category: ${problem.categoryLabel}`,
          "Treat this as a live reasoning problem. Use the editor only as a scratchpad.",
        ],
        optimalApproach: problem.solution,
        starterCode:
          "// Use this space as a scratchpad for cases, equations, or a proof outline.\n",
      },
    };
  }, [problem]);

  if (!scenario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200 px-6 text-center">
        <div className="max-w-sm space-y-2">
          <p className="font-medium text-base-content">Could not load this quant problem</p>
          <p className="text-sm text-base-content/60">
            The problem slug does not match the local BrainStellar dataset.
          </p>
        </div>
      </div>
    );
  }

  return <PracticeSession scenario={scenario} />;
}
