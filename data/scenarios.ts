export type RoleTrack = {
  id: string;
  name: string;
  description: string;
  gradient: string;
  completed: number;
  total: number;
};

export type Scenario = {
  id: string;
  title: string;
  prompt: string;
  trackId: string;
  trackLabel: string;
  difficulty: "Foundations" | "Growth" | "Stretch";
  interviewer: string;
  interviewerRole: string;
  interviewerAvatar: string;
  mastery: number;
  duration: string;
  focus: string[];
  hints: string[];
  rubric: string[];
  followUps: string[];
};

export const roleTracks: RoleTrack[] = [
  {
    id: "staff-engineering",
    name: "Staff Software Engineer",
    description: "Behavioral, leadership, and technical communication loops.",
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    completed: 6,
    total: 14,
  },
  {
    id: "product-management",
    name: "Product Manager",
    description: "Prioritization, strategy, and stakeholder scenarios.",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    completed: 4,
    total: 11,
  },
  {
    id: "consulting",
    name: "Consulting",
    description: "Structured thinking, synthesis, and executive communication.",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    completed: 2,
    total: 9,
  },
];

export const scenarios: Scenario[] = [
  {
    id: "staff-swe-story",
    title: "Tell me about yourself for a staff-level role",
    prompt:
      "Walk me through the parts of your background that make you a strong fit for a staff software engineering interview loop.",
    trackId: "staff-engineering",
    trackLabel: "Staff Software Engineer",
    difficulty: "Foundations",
    interviewer: "Sarah Chen",
    interviewerRole: "Engineering Director",
    interviewerAvatar:
      "https://images.unsplash.com/photo-1770058428154-9eee8a6a1fbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    mastery: 68,
    duration: "8 min",
    focus: ["Positioning", "Narrative", "Relevance"],
    hints: [
      "Open with your current scope and technical leverage.",
      "Show two role transitions that explain your growth.",
      "Tie your story to team impact, not just code shipped.",
      "Land on why this role is the natural next step.",
    ],
    rubric: [
      "Clarity",
      "Role fit",
      "Specificity",
      "Executive presence",
      "Conciseness",
    ],
    followUps: [
      "What distinguishes you from other strong senior engineers?",
      "Why is now the right time for a staff move?",
      "How do you influence without authority?",
    ],
  },
  {
    id: "staff-swe-conflict",
    title: "Resolve a cross-functional conflict",
    prompt:
      "Describe a time you had to align engineering, product, and design when goals were in tension.",
    trackId: "staff-engineering",
    trackLabel: "Staff Software Engineer",
    difficulty: "Growth",
    interviewer: "Marcus Rivera",
    interviewerRole: "VP Product",
    interviewerAvatar:
      "https://images.unsplash.com/photo-1762522927402-f390672558d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    mastery: 41,
    duration: "10 min",
    focus: ["Conflict resolution", "Tradeoffs", "Influence"],
    hints: [
      "Explain the tension in plain language.",
      "Show how you surfaced tradeoffs instead of picking sides.",
      "Describe how alignment changed the outcome.",
      "Quantify impact after the conflict was resolved.",
    ],
    rubric: [
      "Empathy",
      "Decision quality",
      "Tradeoff framing",
      "Ownership",
      "Maturity",
    ],
    followUps: [
      "What would you do differently next time?",
      "Who disagreed most strongly with you, and why?",
    ],
  },
  {
    id: "pm-prioritization",
    title: "Defend a prioritization call",
    prompt:
      "You have one quarter, limited engineering capacity, and three high-stakes asks. How do you decide what ships?",
    trackId: "product-management",
    trackLabel: "Product Manager",
    difficulty: "Growth",
    interviewer: "Ava Patel",
    interviewerRole: "Head of Product",
    interviewerAvatar:
      "https://images.unsplash.com/photo-1666867936058-de34bfd5b320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    mastery: 52,
    duration: "9 min",
    focus: ["Prioritization", "Judgment", "Communication"],
    hints: [
      "State your framework before making the call.",
      "Discuss opportunity cost explicitly.",
      "Show how you communicate tradeoffs to stakeholders.",
      "Name the signal you would watch after launch.",
    ],
    rubric: [
      "Structure",
      "User judgment",
      "Business reasoning",
      "Communication",
      "Decisiveness",
    ],
    followUps: [
      "How would your answer change if leadership disagreed?",
      "What data would make you change direction?",
    ],
  },
  {
    id: "consulting-synthesis",
    title: "Synthesize a case recommendation",
    prompt:
      "You have 60 seconds left with the client. Deliver a concise recommendation with risks and next steps.",
    trackId: "consulting",
    trackLabel: "Consulting",
    difficulty: "Stretch",
    interviewer: "Daniel Brooks",
    interviewerRole: "Engagement Manager",
    interviewerAvatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    mastery: 24,
    duration: "7 min",
    focus: ["Synthesis", "Executive summary", "Confidence"],
    hints: [
      "Lead with the recommendation, not the analysis.",
      "Name one reason, one risk, and one next step.",
      "Use short sentences with clear signposting.",
      "Finish before time instead of squeezing in more detail.",
    ],
    rubric: [
      "Top-down structure",
      "Confidence",
      "Business logic",
      "Risk awareness",
      "Conciseness",
    ],
    followUps: [
      "What assumption in your recommendation is weakest?",
      "How would you test your recommendation quickly?",
    ],
  },
];

export const featuredScenarios = scenarios.slice(0, 4);

export const improvementThemes = [
  {
    id: "results",
    title: "Results are still too soft",
    tag: "Specificity",
    source: "Staff intro loop",
    description:
      "You explain scope clearly, but the strongest answers still land on metrics and business movement.",
  },
  {
    id: "pace",
    title: "Delivery speeds up under pressure",
    tag: "Presence",
    source: "Consulting synthesis",
    description:
      "Pacing spikes when you summarize recommendations. A firmer cadence will make your answer sound more senior.",
  },
];

export const weeklyGoals = [
  { label: "Complete 4 practice loops this week", current: 2, total: 4 },
  { label: "Raise staff intro mastery to 80%", current: 68, total: 80 },
  { label: "Hit a 90+ clarity score once", current: 83, total: 90 },
];

export const profileStats = [
  { label: "Sessions", value: "28", accent: "text-primary" },
  { label: "Average Score", value: "79", accent: "text-emerald-500" },
  { label: "Tracks Active", value: "3", accent: "text-sky-500" },
  { label: "Best Attempt", value: "93", accent: "text-amber-500" },
];

export const profileMastery = [
  { name: "Behavioral storytelling", level: 76, sessions: 10 },
  { name: "Executive communication", level: 63, sessions: 8 },
  { name: "Conflict resolution", level: 58, sessions: 6 },
  { name: "Strategy and tradeoffs", level: 49, sessions: 4 },
];

export const coachMessages = [
  {
    role: "coach" as const,
    text:
      "Your strongest recent pattern is structure. The biggest remaining gap is still the final 20% of the answer: clear results, crisp closing, and explicit role fit.",
  },
  {
    role: "user" as const,
    text: "That makes sense. I still sound vague at the end of my stories.",
  },
  {
    role: "coach" as const,
    text:
      "Use a three-line finish: result, why it mattered, why it changed how you operate. That keeps your close concrete and senior.",
  },
];

export const reviewByScenario: Record<
  string,
  {
    overallScore: number;
    previousScore: number;
    dimensions: { name: string; score: number; change: number }[];
    strengths: string[];
    improvements: string[];
    tips: string[];
    transcript: { time: string; text: string; highlight?: "strength" | "improve" }[];
  }
> = {
  "staff-swe-story": {
    overallScore: 84,
    previousScore: 75,
    dimensions: [
      { name: "Clarity", score: 90, change: 8 },
      { name: "Role fit", score: 86, change: 10 },
      { name: "Specificity", score: 77, change: 7 },
      { name: "Executive presence", score: 83, change: 6 },
      { name: "Conciseness", score: 80, change: 4 },
    ],
    strengths: [
      "You positioned your scope immediately and made the staff target explicit.",
      "Your migration example sounded credible and outcome-oriented.",
      "The answer flowed naturally instead of feeling memorized.",
    ],
    improvements: [
      "The middle section still spends too long on implementation detail.",
      "Your close could tie more directly to why this specific role fits now.",
      "Add one more quantifiable result to your most recent story.",
    ],
    tips: [
      "Use a 30-60-30 split: past, present, then why this role.",
      "Replace one generic adjective with a metric or scope number.",
      "Close with how your leverage changed, not just what you built.",
    ],
    transcript: [
      {
        time: "0:09",
        text:
          "I currently lead platform reliability work across three product squads, which is where I learned I enjoy multiplying other engineers.",
        highlight: "strength",
      },
      {
        time: "0:32",
        text:
          "I helped move a legacy frontend architecture to a shared component model, which reduced ship time for partner teams by roughly 35%.",
        highlight: "strength",
      },
      {
        time: "0:58",
        text:
          "Then I also touched a lot of things, from developer tooling to CI to testing and onboarding, and learned a lot from those experiences.",
        highlight: "improve",
      },
      {
        time: "1:21",
        text:
          "That combination of technical depth and org-level leverage is why this staff loop feels like the right next challenge.",
      },
    ],
  },
};

export function getScenarioById(id: string) {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
}

export function getReviewByScenarioId(id: string) {
  return reviewByScenario[id] ?? reviewByScenario["staff-swe-story"];
}
