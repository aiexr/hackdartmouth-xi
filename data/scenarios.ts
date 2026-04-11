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
    completed: 3,
    total: 7,
  },
  {
    id: "product-management",
    name: "Product Manager",
    description: "Prioritization, strategy, and stakeholder scenarios.",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    completed: 2,
    total: 7,
  },
  {
    id: "consulting",
    name: "Consulting",
    description: "Structured thinking, synthesis, and executive communication.",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    completed: 1,
    total: 7,
  },
];

const AVATAR_SARAH =
  "https://images.unsplash.com/photo-1770058428154-9eee8a6a1fbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const AVATAR_MARCUS =
  "https://images.unsplash.com/photo-1762522927402-f390672558d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const AVATAR_AVA =
  "https://images.unsplash.com/photo-1666867936058-de34bfd5b320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const AVATAR_DANIEL =
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";

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
    interviewerAvatar: AVATAR_SARAH,
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
    id: "staff-swe-mentorship",
    title: "Grow a struggling engineer",
    prompt:
      "Tell me about a time you helped a mid-level engineer on your team level up. Where did they start, what did you change, and where did they land?",
    trackId: "staff-engineering",
    trackLabel: "Staff Software Engineer",
    difficulty: "Foundations",
    interviewer: "Sarah Chen",
    interviewerRole: "Engineering Director",
    interviewerAvatar: AVATAR_SARAH,
    mastery: 54,
    duration: "9 min",
    focus: ["Mentorship", "Feedback", "People growth"],
    hints: [
      "Describe the gap you saw before you intervened.",
      "Show the specific rituals or feedback you changed.",
      "Separate their growth from your own leverage.",
      "Close with a concrete outcome for the team.",
    ],
    rubric: [
      "Empathy",
      "Coaching instinct",
      "Ownership",
      "Outcome focus",
      "Humility",
    ],
    followUps: [
      "What feedback was hardest for them to hear?",
      "How did you know your coaching was working?",
    ],
  },
  {
    id: "staff-swe-system-design-intro",
    title: "Walk through a system you designed",
    prompt:
      "Pick a real system you led the design for and walk me through the requirements, the key tradeoffs, and what you'd change in hindsight.",
    trackId: "staff-engineering",
    trackLabel: "Staff Software Engineer",
    difficulty: "Foundations",
    interviewer: "Marcus Rivera",
    interviewerRole: "Principal Engineer",
    interviewerAvatar: AVATAR_MARCUS,
    mastery: 47,
    duration: "12 min",
    focus: ["System design", "Tradeoffs", "Technical communication"],
    hints: [
      "State the constraints before any architecture.",
      "Call out two alternatives you rejected and why.",
      "Use scale numbers where you can.",
      "End with a hindsight decision you'd flip today.",
    ],
    rubric: [
      "Requirement framing",
      "Tradeoff reasoning",
      "Depth of detail",
      "Hindsight awareness",
      "Technical clarity",
    ],
    followUps: [
      "What single constraint drove most of your design?",
      "How did you validate the design before building?",
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
    interviewerAvatar: AVATAR_MARCUS,
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
    id: "staff-swe-incident",
    title: "Lead a customer-visible incident retro",
    prompt:
      "Walk me through a high-severity incident you led the response on. How did you triage, communicate, and follow up after?",
    trackId: "staff-engineering",
    trackLabel: "Staff Software Engineer",
    difficulty: "Growth",
    interviewer: "Sarah Chen",
    interviewerRole: "Engineering Director",
    interviewerAvatar: AVATAR_SARAH,
    mastery: 38,
    duration: "10 min",
    focus: ["Incident response", "Communication", "Systems thinking"],
    hints: [
      "Describe how you triaged severity in the first 10 minutes.",
      "Show how you communicated up and sideways.",
      "Distinguish quick mitigation from durable fix.",
      "End with the process change that came out of the retro.",
    ],
    rubric: [
      "Decisiveness",
      "Calm under pressure",
      "Root-cause depth",
      "Communication",
      "Follow-through",
    ],
    followUps: [
      "What did you choose not to fix, and why?",
      "How did you rebuild customer trust afterward?",
    ],
  },
  {
    id: "staff-swe-tech-strategy",
    title: "Pitch a multi-quarter tech strategy",
    prompt:
      "You need to convince leadership to fund a 2-quarter platform investment that has no direct customer-facing feature. Walk me through your pitch.",
    trackId: "staff-engineering",
    trackLabel: "Staff Software Engineer",
    difficulty: "Stretch",
    interviewer: "Marcus Rivera",
    interviewerRole: "VP Engineering",
    interviewerAvatar: AVATAR_MARCUS,
    mastery: 22,
    duration: "12 min",
    focus: ["Strategy", "Business framing", "Executive comms"],
    hints: [
      "Lead with the business cost of inaction.",
      "Translate platform work into product-team leverage.",
      "Name a measurable checkpoint leadership can hold you to.",
      "Pre-empt the most likely pushback before it is asked.",
    ],
    rubric: [
      "Business framing",
      "Strategic clarity",
      "Executive presence",
      "Risk awareness",
      "Persuasiveness",
    ],
    followUps: [
      "What would you cut first if you only got half the funding?",
      "How would you measure success 6 months in?",
    ],
  },
  {
    id: "staff-swe-ambiguous-initiative",
    title: "Own an org-wide ambiguous initiative",
    prompt:
      "Leadership asks you to lead an initiative with unclear scope, no dedicated team, and three stakeholders with conflicting views. How do you start?",
    trackId: "staff-engineering",
    trackLabel: "Staff Software Engineer",
    difficulty: "Stretch",
    interviewer: "Sarah Chen",
    interviewerRole: "Engineering Director",
    interviewerAvatar: AVATAR_SARAH,
    mastery: 18,
    duration: "11 min",
    focus: ["Ambiguity", "Stakeholder alignment", "Staff judgment"],
    hints: [
      "Reframe the ask as a problem statement before planning.",
      "Describe your first-two-weeks discovery plan.",
      "Show how you'd force alignment between the three stakeholders.",
      "Name the decision you would escalate and when.",
    ],
    rubric: [
      "Problem framing",
      "Stakeholder handling",
      "Bias for action",
      "Judgment",
      "Scope discipline",
    ],
    followUps: [
      "When would you declare the initiative failed?",
      "How would you say no to one of the stakeholders?",
    ],
  },
  {
    id: "pm-metric-drop",
    title: "Diagnose a sudden DAU drop",
    prompt:
      "Daily active users dropped 12% week-over-week with no obvious cause. Walk me through how you'd investigate and what you'd tell leadership in 24 hours.",
    trackId: "product-management",
    trackLabel: "Product Manager",
    difficulty: "Foundations",
    interviewer: "Ava Patel",
    interviewerRole: "Head of Product",
    interviewerAvatar: AVATAR_AVA,
    mastery: 58,
    duration: "9 min",
    focus: ["Analytics", "Diagnosis", "Communication"],
    hints: [
      "Decompose DAU before guessing causes.",
      "Separate internal changes from external shocks.",
      "State what you'd rule out first and why.",
      "Prepare a crisp executive update with confidence bounds.",
    ],
    rubric: [
      "Metric decomposition",
      "Hypothesis discipline",
      "Prioritization of signals",
      "Communication",
      "Speed to insight",
    ],
    followUps: [
      "What would you do if the data platform is down?",
      "How would you prevent over-reacting to noise?",
    ],
  },
  {
    id: "pm-product-sense",
    title: "Improve a product you use every day",
    prompt:
      "Pick a product you use daily, tell me who its core user is, and walk me through the single highest-impact improvement you would ship next.",
    trackId: "product-management",
    trackLabel: "Product Manager",
    difficulty: "Foundations",
    interviewer: "Ava Patel",
    interviewerRole: "Head of Product",
    interviewerAvatar: AVATAR_AVA,
    mastery: 61,
    duration: "10 min",
    focus: ["Product sense", "User empathy", "Prioritization"],
    hints: [
      "Ground the user in a specific scenario, not a persona.",
      "Name the core job they're hiring the product for.",
      "Justify why your improvement beats two alternatives.",
      "Close with how you'd measure success.",
    ],
    rubric: [
      "User empathy",
      "Problem framing",
      "Solution quality",
      "Impact reasoning",
      "Narrative",
    ],
    followUps: [
      "How would you know in a week if it was working?",
      "What user would hate this change?",
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
    interviewerAvatar: AVATAR_AVA,
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
    id: "pm-stakeholder-pushback",
    title: "Handle stakeholder pushback on your roadmap",
    prompt:
      "A senior GM pushes hard to add their pet feature to your roadmap two weeks before kickoff. It isn't a fit. How do you handle the conversation?",
    trackId: "product-management",
    trackLabel: "Product Manager",
    difficulty: "Growth",
    interviewer: "Marcus Rivera",
    interviewerRole: "VP Product",
    interviewerAvatar: AVATAR_MARCUS,
    mastery: 44,
    duration: "10 min",
    focus: ["Stakeholder management", "Negotiation", "Influence"],
    hints: [
      "Acknowledge the underlying concern before saying no.",
      "Use data to anchor the conversation, not opinion.",
      "Offer a structured alternative instead of a flat rejection.",
      "Close with a clear commitment you can both track.",
    ],
    rubric: [
      "Empathy",
      "Negotiation",
      "Clarity",
      "Data discipline",
      "Outcome focus",
    ],
    followUps: [
      "What if they escalate over your head?",
      "How would you rebuild the relationship afterward?",
    ],
  },
  {
    id: "pm-launch-decision",
    title: "Call go / no-go on a launch",
    prompt:
      "You're 48 hours from launch. QA just surfaced a non-blocking issue affecting 3% of users. You're the PM. Call it.",
    trackId: "product-management",
    trackLabel: "Product Manager",
    difficulty: "Growth",
    interviewer: "Ava Patel",
    interviewerRole: "Head of Product",
    interviewerAvatar: AVATAR_AVA,
    mastery: 39,
    duration: "8 min",
    focus: ["Decisiveness", "Risk", "Communication"],
    hints: [
      "State the call before laying out the reasoning.",
      "Walk me through the factors you weighted.",
      "Describe the rollout plan that makes the call safer.",
      "Show how you'd communicate the decision to the team.",
    ],
    rubric: [
      "Decisiveness",
      "Risk framing",
      "Communication",
      "Operational detail",
      "Accountability",
    ],
    followUps: [
      "What signal would make you roll back immediately?",
      "How would you defend this call to the CEO?",
    ],
  },
  {
    id: "pm-zero-to-one",
    title: "Propose a 0→1 product bet",
    prompt:
      "You've been given 90 days and 4 engineers to prove a new product line could work. Walk me through how you spend week 1 through week 12.",
    trackId: "product-management",
    trackLabel: "Product Manager",
    difficulty: "Stretch",
    interviewer: "Marcus Rivera",
    interviewerRole: "VP Product",
    interviewerAvatar: AVATAR_MARCUS,
    mastery: 25,
    duration: "12 min",
    focus: ["Strategy", "Discovery", "Bias for action"],
    hints: [
      "Define the hypothesis you're actually testing, not the product.",
      "Separate discovery, validation, and build phases.",
      "Name the riskiest assumption you need to kill early.",
      "State the kill criteria, not just the success criteria.",
    ],
    rubric: [
      "Strategic clarity",
      "Experiment design",
      "Prioritization",
      "Pragmatism",
      "Narrative",
    ],
    followUps: [
      "What would you do differently on day 1 with only 2 engineers?",
      "How would you know when to pivot vs. kill?",
    ],
  },
  {
    id: "consulting-market-sizing",
    title: "Size a new market fast",
    prompt:
      "Estimate the annual revenue opportunity for a new urban electric scooter subscription service in a mid-sized US city. Show your work.",
    trackId: "consulting",
    trackLabel: "Consulting",
    difficulty: "Foundations",
    interviewer: "Daniel Brooks",
    interviewerRole: "Engagement Manager",
    interviewerAvatar: AVATAR_DANIEL,
    mastery: 45,
    duration: "8 min",
    focus: ["Market sizing", "Structured thinking", "Mental math"],
    hints: [
      "Lay out your equation before plugging numbers.",
      "State every assumption with a reason.",
      "Bound your answer instead of chasing a single number.",
      "Sanity-check your result at the end.",
    ],
    rubric: [
      "Structure",
      "Assumption quality",
      "Mental math",
      "Pragmatism",
      "Communication",
    ],
    followUps: [
      "Which assumption has the biggest leverage on your number?",
      "How would your estimate change in a dense city?",
    ],
  },
  {
    id: "consulting-profitability",
    title: "Diagnose a profitability drop",
    prompt:
      "A regional grocery chain saw profit fall 18% year-over-year despite flat revenue. Walk me through how you'd structure the diagnosis.",
    trackId: "consulting",
    trackLabel: "Consulting",
    difficulty: "Foundations",
    interviewer: "Daniel Brooks",
    interviewerRole: "Engagement Manager",
    interviewerAvatar: AVATAR_DANIEL,
    mastery: 42,
    duration: "10 min",
    focus: ["Profitability", "Structure", "Hypothesis testing"],
    hints: [
      "Decompose profit before guessing causes.",
      "Separate revenue, cost of goods, and operating cost.",
      "Walk me through which branch you'd test first and why.",
      "State the data you'd ask the client for up front.",
    ],
    rubric: [
      "Framework",
      "Prioritization",
      "Hypothesis discipline",
      "Business sense",
      "Communication",
    ],
    followUps: [
      "What non-financial signal would change your diagnosis?",
      "What's the riskiest assumption in your framework?",
    ],
  },
  {
    id: "consulting-market-entry",
    title: "Recommend a market entry strategy",
    prompt:
      "A European DTC coffee brand wants to enter the US market. They have €15M to spend. Walk me through how you'd think about entry mode and go-to-market.",
    trackId: "consulting",
    trackLabel: "Consulting",
    difficulty: "Growth",
    interviewer: "Daniel Brooks",
    interviewerRole: "Engagement Manager",
    interviewerAvatar: AVATAR_DANIEL,
    mastery: 31,
    duration: "11 min",
    focus: ["Strategy", "Entry mode", "Competitive framing"],
    hints: [
      "Lay out your structure before committing to a mode.",
      "Compare two entry modes explicitly on the same axes.",
      "Use the budget constraint to force hard choices.",
      "Close with what you'd pilot first and where.",
    ],
    rubric: [
      "Structure",
      "Strategic reasoning",
      "Tradeoff framing",
      "Business judgment",
      "Recommendation clarity",
    ],
    followUps: [
      "What would make you recommend *not* entering?",
      "How would you measure success in year one?",
    ],
  },
  {
    id: "consulting-client-pushback",
    title: "Handle a skeptical client in the room",
    prompt:
      "You've just presented a recommendation and the client CFO visibly disagrees. She says your numbers don't reflect her business. How do you respond in the room?",
    trackId: "consulting",
    trackLabel: "Consulting",
    difficulty: "Growth",
    interviewer: "Marcus Rivera",
    interviewerRole: "Senior Partner",
    interviewerAvatar: AVATAR_MARCUS,
    mastery: 28,
    duration: "8 min",
    focus: ["Executive presence", "Pushback", "Active listening"],
    hints: [
      "Acknowledge her concern before defending anything.",
      "Ask a question to narrow the disagreement.",
      "Separate a data gap from a framing gap.",
      "Offer a concrete next step instead of rehashing the analysis.",
    ],
    rubric: [
      "Composure",
      "Listening",
      "Empathy",
      "Analytical defense",
      "Recovery",
    ],
    followUps: [
      "What if she pushes again after your response?",
      "How would you debrief with your partner afterward?",
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
    interviewerAvatar: AVATAR_DANIEL,
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
  {
    id: "consulting-ops-turnaround",
    title: "Turn around a failing operation",
    prompt:
      "A mid-market manufacturer is missing shipping SLAs on 22% of orders. Their CEO asks how you'd turn operations around in 90 days. Walk me through it.",
    trackId: "consulting",
    trackLabel: "Consulting",
    difficulty: "Stretch",
    interviewer: "Daniel Brooks",
    interviewerRole: "Engagement Manager",
    interviewerAvatar: AVATAR_DANIEL,
    mastery: 19,
    duration: "12 min",
    focus: ["Operations", "Change management", "Pragmatism"],
    hints: [
      "Separate quick-win moves from durable changes.",
      "Name the one metric you'd orient the whole team around.",
      "Show how you'd handle likely frontline resistance.",
      "Be explicit about what you'd stop doing.",
    ],
    rubric: [
      "Operational insight",
      "Prioritization",
      "Change management",
      "Pragmatism",
      "Executive framing",
    ],
    followUps: [
      "What would you do in week 1 alone?",
      "How would you know the turnaround was real and not cosmetic?",
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

type ReviewShape = (typeof reviewByScenario)[string];

function buildFallbackReview(scenario: Scenario): ReviewShape {
  const base = 60 + Math.round((scenario.mastery ?? 50) / 4);
  const dimensions = scenario.rubric.map((name, index) => ({
    name,
    score: Math.min(95, base + index * 2),
    change: 3 + (index % 4),
  }));

  return {
    overallScore: Math.min(94, base + 6),
    previousScore: Math.max(40, base - 5),
    dimensions,
    strengths: [
      `You set up the ${scenario.focus[0]?.toLowerCase() ?? "core"} framing cleanly before diving in.`,
      `Your answer tracked the ${scenario.trackLabel.toLowerCase()} expectations an interviewer listens for.`,
      "The middle of the answer stayed organized under follow-up pressure.",
    ],
    improvements: [
      `Push one level deeper on ${scenario.rubric[scenario.rubric.length - 1]?.toLowerCase() ?? "closing detail"}.`,
      "Swap one generic phrase for a concrete number or outcome.",
      `Tie the close more directly to ${scenario.focus[scenario.focus.length - 1]?.toLowerCase() ?? "impact"}.`,
    ],
    tips: scenario.hints.slice(0, 3),
    transcript: [
      {
        time: "0:08",
        text: `Opened with the core framing for: ${scenario.prompt}`,
        highlight: "strength" as const,
      },
      {
        time: "0:34",
        text: `Walked through the tradeoffs around ${scenario.focus[0]?.toLowerCase() ?? "the main decision"}.`,
      },
      {
        time: "1:02",
        text: "Pacing slowed here — this is where interviewers usually lose the thread.",
        highlight: "improve" as const,
      },
      {
        time: "1:28",
        text: `Closed on the impact expected for a ${scenario.difficulty.toLowerCase()} ${scenario.trackLabel.toLowerCase()} loop.`,
      },
    ],
  };
}

export function getReviewByScenarioId(id: string) {
  if (reviewByScenario[id]) return reviewByScenario[id];
  const scenario = scenarios.find((item) => item.id === id);
  if (scenario) return buildFallbackReview(scenario);
  return reviewByScenario["staff-swe-story"];
}
