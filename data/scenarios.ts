export type Scenario = {
  id: string;
  title: string;
  prompt: string;
  category: "behavioral" | "technical" | "system-design";
  pattern: string;
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
  codingProblem?: {
    description: string;
    examples: Array<{
      input: string;
      output: string;
      explanation?: string;
    }>;
    constraints: string[];
    optimalApproach: string;
    starterCode?: string;
    functionName?: string;
    testCases?: Array<{
      args: unknown[];
      expected: unknown;
    }>;
  };
};


const AVATAR_SARAH =
  "https://images.unsplash.com/photo-1770058428154-9eee8a6a1fbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const AVATAR_MARCUS =
  "https://images.unsplash.com/photo-1762522927402-f390672558d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const AVATAR_AVA =
  "https://images.unsplash.com/photo-1666867936058-de34bfd5b320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const AVATAR_DANIEL =
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";

const scenarioBank: Array<Omit<Scenario, "category" | "pattern">> = [
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
    interviewerRole: "Engagement Manager",
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
  {
    id: "technical-two-sum",
    title: "Code Two Sum live",
    prompt:
      "We'll work through a coding problem together. Talk through your approach, write the solution in the editor, and explain the complexity tradeoffs as you go.",
    trackId: "staff-engineering",
    trackLabel: "Technical Coding",
    difficulty: "Foundations",
    interviewer: "Marcus Rivera",
    interviewerRole: "Senior Engineer",
    interviewerAvatar: AVATAR_MARCUS,
    mastery: 36,
    duration: "18 min",
    focus: ["Hash maps", "Complexity", "Verbal reasoning"],
    hints: [
      "Restate the problem before you touch the keyboard.",
      "Name the brute-force baseline and why you are moving past it.",
      "Explain why the hash map lookup works in one pass.",
      "Call out the exact time and space complexity after you code.",
    ],
    rubric: [
      "Correctness",
      "Complexity analysis",
      "Communication",
      "Code quality",
      "Edge-case awareness",
    ],
    followUps: [
      "What would you change if duplicate values were common?",
      "How would you test the negative-number and repeated-index cases?",
    ],
    codingProblem: {
      description:
        "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`. Assume exactly one valid answer exists and you may not use the same element twice.",
      examples: [
        {
          input: "nums = [2,7,11,15], target = 9",
          output: "[0,1]",
          explanation: "nums[0] + nums[1] = 9.",
        },
        {
          input: "nums = [3,2,4], target = 6",
          output: "[1,2]",
        },
      ],
      constraints: [
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
        "-10^9 <= target <= 10^9",
      ],
      optimalApproach:
        "Use a hash map from value to index while scanning once. For each number, check whether `target - nums[i]` has already been seen; if so, return the previous index and `i`. This gives O(n) time and O(n) space.",
      starterCode:
        "function twoSum(nums: number[], target: number): number[] {\n  // Write your solution here.\n  return [];\n}",
      functionName: "twoSum",
      testCases: [
        { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
        { args: [[3, 2, 4], 6], expected: [1, 2] },
        { args: [[3, 3], 6], expected: [0, 1] },
      ],
    },
  },
  {
    id: "technical-valid-parentheses",
    title: "Validate parentheses with a stack",
    prompt:
      "Solve the problem in the editor while narrating your invariants. I care as much about how you reason about correctness as the final code.",
    trackId: "staff-engineering",
    trackLabel: "Technical Coding",
    difficulty: "Foundations",
    interviewer: "Sarah Chen",
    interviewerRole: "Engineering Manager",
    interviewerAvatar: AVATAR_SARAH,
    mastery: 33,
    duration: "18 min",
    focus: ["Stacks", "Invariants", "Edge cases"],
    hints: [
      "Define what the stack represents before coding.",
      "Decide how you will map closing brackets to openings.",
      "Handle early failure cases explicitly.",
      "Close by explaining why leftover stack entries mean invalid input.",
    ],
    rubric: [
      "Correctness",
      "State management",
      "Communication",
      "Code clarity",
      "Testing instinct",
    ],
    followUps: [
      "How would you simplify the mapping logic further?",
      "What test cases prove your implementation handles nested and broken input?",
    ],
    codingProblem: {
      description:
        "Given a string `s` containing just the characters `()[]{}`, determine if the input string is valid. A string is valid if open brackets are closed by the same type of brackets and in the correct order.",
      examples: [
        {
          input: 's = "()[]{}"',
          output: "true",
        },
        {
          input: 's = "(]"',
          output: "false",
          explanation: "The closing bracket does not match the most recent opening bracket.",
        },
      ],
      constraints: [
        "1 <= s.length <= 10^4",
        "s consists only of the characters ()[]{}",
      ],
      optimalApproach:
        "Use a stack to track unmatched opening brackets. On every closing bracket, verify it matches the latest opening bracket and fail fast if not. This yields O(n) time and O(n) space in the worst case.",
      starterCode:
        "function isValid(s: string): boolean {\n  // Write your solution here.\n  return false;\n}",
      functionName: "isValid",
      testCases: [
        { args: ["()[]{}"], expected: true },
        { args: ["(]"], expected: false },
        { args: ["([)]"], expected: false },
        { args: ["{[]}"], expected: true },
        { args: [""], expected: true },
      ],
    },
  },
  {
    id: "technical-merge-intervals",
    title: "Merge overlapping intervals",
    prompt:
      "Work the problem live and keep narrating what invariant your merged output maintains after each iteration.",
    trackId: "staff-engineering",
    trackLabel: "Technical Coding",
    difficulty: "Growth",
    interviewer: "Marcus Rivera",
    interviewerRole: "Staff Engineer",
    interviewerAvatar: AVATAR_MARCUS,
    mastery: 29,
    duration: "20 min",
    focus: ["Sorting", "Intervals", "Invariants"],
    hints: [
      "State why sorting is the right first move.",
      "Explain what goes in the output when intervals overlap.",
      "Be explicit about inclusive boundaries.",
      "Mention the complexity added by the initial sort.",
    ],
    rubric: [
      "Correctness",
      "Complexity analysis",
      "Communication",
      "Data-structure choice",
      "Edge-case handling",
    ],
    followUps: [
      "How would you adapt the approach if the intervals streamed in over time?",
      "What cases would you use to verify touching intervals behave correctly?",
    ],
    codingProblem: {
      description:
        "Given an array of intervals where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all input intervals.",
      examples: [
        {
          input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
          output: "[[1,6],[8,10],[15,18]]",
        },
        {
          input: "intervals = [[1,4],[4,5]]",
          output: "[[1,5]]",
          explanation: "Intervals that touch at the boundary should be merged.",
        },
      ],
      constraints: [
        "1 <= intervals.length <= 10^4",
        "intervals[i].length == 2",
        "0 <= start_i <= end_i <= 10^4",
      ],
      optimalApproach:
        "Sort intervals by start time, then scan once while keeping the last merged interval. If the current interval overlaps the last merged interval, extend its end; otherwise append a new interval. This is O(n log n) time and O(n) output space.",
      starterCode:
        "function merge(intervals: number[][]): number[][] {\n  // Write your solution here.\n  return [];\n}",
      functionName: "merge",
      testCases: [
        { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
        { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
        { args: [[[1, 4], [0, 4]]], expected: [[0, 4]] },
      ],
    },
  },
  {
    id: "technical-top-k-frequent",
    title: "Find the top K frequent elements",
    prompt:
      "Explain the solution space first, then code the version you would ship in an interview while defending the complexity.",
    trackId: "staff-engineering",
    trackLabel: "Technical Coding",
    difficulty: "Growth",
    interviewer: "Sarah Chen",
    interviewerRole: "Engineering Manager",
    interviewerAvatar: AVATAR_SARAH,
    mastery: 24,
    duration: "20 min",
    focus: ["Frequency counting", "Heaps", "Complexity tradeoffs"],
    hints: [
      "Separate counting from selection.",
      "Name the tradeoff between sorting all counts and maintaining a heap.",
      "Explain what happens when multiple values share the same frequency.",
      "Close by stating the complexity of the exact approach you coded.",
    ],
    rubric: [
      "Correctness",
      "Complexity analysis",
      "Tradeoff reasoning",
      "Communication",
      "Code organization",
    ],
    followUps: [
      "When would you prefer bucket sort instead of a heap?",
      "How would the approach change if the input were a large data stream?",
    ],
    codingProblem: {
      description:
        "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in any order.",
      examples: [
        {
          input: "nums = [1,1,1,2,2,3], k = 2",
          output: "[1,2]",
        },
        {
          input: "nums = [1], k = 1",
          output: "[1]",
        },
      ],
      constraints: [
        "1 <= nums.length <= 10^5",
        "-10^4 <= nums[i] <= 10^4",
        "1 <= k <= number of unique elements",
      ],
      optimalApproach:
        "Count frequencies with a hash map, then either keep a min-heap of size `k` or bucket values by frequency. A heap-based solution runs in O(n log k) time and O(n) space and is usually the clearest interview answer.",
      starterCode:
        "function topKFrequent(nums: number[], k: number): number[] {\n  // Write your solution here.\n  return [];\n}",
      functionName: "topKFrequent",
      testCases: [
        { args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] },
        { args: [[1], 1], expected: [1] },
        { args: [[4, 1, -1, 2, -1, 2, 3], 2], expected: [-1, 2] },
      ],
    },
  },
  {
    id: "technical-lru-cache",
    title: "Design an LRU cache",
    prompt:
      "Treat this like a collaborative whiteboard-to-code round: explain the data structure design, then implement the core operations while I probe correctness and complexity.",
    trackId: "staff-engineering",
    trackLabel: "Technical Coding",
    difficulty: "Stretch",
    interviewer: "Marcus Rivera",
    interviewerRole: "Principal Engineer",
    interviewerAvatar: AVATAR_MARCUS,
    mastery: 18,
    duration: "24 min",
    focus: ["Data structures", "API design", "Complexity guarantees"],
    hints: [
      "Start by stating the required complexity for `get` and `put`.",
      "Explain why a map alone is not enough.",
      "Define the responsibilities of the linked list nodes before coding.",
      "Talk through eviction behavior with a concrete example.",
    ],
    rubric: [
      "Correctness",
      "Complexity guarantees",
      "Communication",
      "Implementation quality",
      "Edge-case awareness",
    ],
    followUps: [
      "What bugs are common when removing and reinserting nodes?",
      "How would you adapt this if entries also had time-based expiration?",
    ],
    codingProblem: {
      description:
        "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the `LRUCache` class with `get(key)` and `put(key, value)` operations, both in O(1) average time.",
      examples: [
        {
          input:
            '["LRUCache","put","put","get","put","get","put","get","get","get"] with [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
          output: "[null,null,null,1,null,-1,null,-1,3,4]",
        },
      ],
      constraints: [
        "1 <= capacity <= 3000",
        "0 <= key <= 10^4",
        "0 <= value <= 10^5",
        "At most 2 * 10^5 calls will be made to get and put",
      ],
      optimalApproach:
        "Combine a doubly linked list with a hash map from key to node. The list maintains recency order, and the map gives O(1) access to nodes for updates and eviction. Both `get` and `put` stay O(1) on average.",
      starterCode:
        "class LRUCache {\n  constructor(capacity: number) {}\n\n  get(key: number): number {\n    return -1;\n  }\n\n  put(key: number, value: number): void {}\n}\n",
    },
  },
  {
    id: "technical-word-ladder",
    title: "Solve Word Ladder with BFS",
    prompt:
      "Use the editor and narrate your search strategy. I want to hear how you move from brute force to a scalable graph traversal.",
    trackId: "staff-engineering",
    trackLabel: "Technical Coding",
    difficulty: "Stretch",
    interviewer: "Sarah Chen",
    interviewerRole: "Senior Staff Engineer",
    interviewerAvatar: AVATAR_SARAH,
    mastery: 14,
    duration: "24 min",
    focus: ["Graphs", "BFS", "Complexity reasoning"],
    hints: [
      "Explain why shortest path points you toward BFS.",
      "State how you generate valid neighbors efficiently.",
      "Be explicit about visited-state management.",
      "Close with the complexity bottleneck in your implementation.",
    ],
    rubric: [
      "Correctness",
      "Algorithm choice",
      "Complexity analysis",
      "Communication",
      "Code clarity",
    ],
    followUps: [
      "What would you optimize if the dictionary were very large?",
      "How would bidirectional BFS change the tradeoffs?",
    ],
    codingProblem: {
      description:
        "A transformation sequence from `beginWord` to `endWord` uses a dictionary of words where only one letter may change at a time and every intermediate word must exist in the dictionary. Return the length of the shortest transformation sequence, or `0` if none exists.",
      examples: [
        {
          input:
            'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]',
          output: "5",
          explanation: 'One shortest path is "hit" -> "hot" -> "dot" -> "dog" -> "cog".',
        },
      ],
      constraints: [
        "1 <= beginWord.length <= 10",
        "1 <= wordList.length <= 5000",
        "All words have the same length",
      ],
      optimalApproach:
        "Model the words as an implicit graph and run BFS from the begin word. Either generate one-letter mutations on the fly with a hash set lookup or precompute wildcard patterns to reduce repeated work. The intended solution is BFS-based because the first time you reach `endWord` is the shortest path.",
      starterCode:
        "function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {\n  // Write your solution here.\n  return 0;\n}",
      functionName: "ladderLength",
      testCases: [
        { args: ["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], expected: 5 },
        { args: ["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], expected: 0 },
      ],
    },
  },
  {
    id: "system-url-shortener",
    title: "Design a URL shortener",
    prompt:
      "Design a URL shortener end to end. Start with requirements, then walk through the write path, read path, and the key scaling bottlenecks.",
    trackId: "staff-engineering",
    trackLabel: "System Design",
    difficulty: "Foundations",
    interviewer: "Marcus Rivera",
    interviewerRole: "Principal Engineer",
    interviewerAvatar: AVATAR_MARCUS,
    mastery: 27,
    duration: "22 min",
    focus: ["Requirements", "Storage design", "Scalability"],
    hints: [
      "Clarify redirect latency, scale, and custom alias requirements first.",
      "Separate short-code generation from redirect serving.",
      "Talk through hot keys, collisions, and expiration.",
      "Name the first metrics and alerts you would instrument.",
    ],
    rubric: [
      "Requirement clarity",
      "Component design",
      "Tradeoff reasoning",
      "Scaling awareness",
      "Communication",
    ],
    followUps: [
      "How would custom aliases and analytics change the design?",
      "What would you cache and where?",
    ],
  },
  {
    id: "system-feature-flags",
    title: "Design a feature flag platform",
    prompt:
      "Design a feature flag system that product and engineering teams can use to safely roll features out by audience and environment.",
    trackId: "staff-engineering",
    trackLabel: "System Design",
    difficulty: "Growth",
    interviewer: "Sarah Chen",
    interviewerRole: "Engineering Director",
    interviewerAvatar: AVATAR_SARAH,
    mastery: 23,
    duration: "24 min",
    focus: ["Control planes", "Consistency", "Developer tooling"],
    hints: [
      "Split the control plane from the low-latency evaluation path.",
      "Discuss how rules propagate to SDKs safely.",
      "Call out the tradeoff between freshness and availability.",
      "Mention governance concerns like audit history and kill switches.",
    ],
    rubric: [
      "Component clarity",
      "Tradeoff reasoning",
      "Scaling awareness",
      "Operational detail",
      "Communication",
    ],
    followUps: [
      "How would you prevent bad flag rules from taking production down?",
      "What guarantees would your SDK make when the config service is unavailable?",
    ],
  },
  {
    id: "system-realtime-chat",
    title: "Design a realtime chat system",
    prompt:
      "Design a chat system for direct messages and small group chats. Walk me through message delivery, ordering, unread state, and how the architecture changes as traffic grows.",
    trackId: "staff-engineering",
    trackLabel: "System Design",
    difficulty: "Growth",
    interviewer: "Marcus Rivera",
    interviewerRole: "Principal Engineer",
    interviewerAvatar: AVATAR_MARCUS,
    mastery: 19,
    duration: "26 min",
    focus: ["Realtime delivery", "Ordering", "State synchronization"],
    hints: [
      "Clarify online presence, message history, and fan-out assumptions early.",
      "Separate the write path from websocket delivery.",
      "Talk about ordering guarantees per conversation, not globally.",
      "Explain how you would recover clients after disconnects.",
    ],
    rubric: [
      "Requirement clarity",
      "Component design",
      "Tradeoff reasoning",
      "Scaling awareness",
      "Failure handling",
    ],
    followUps: [
      "How would the design change for large channels instead of small groups?",
      "Where would you enforce idempotency and deduplication?",
    ],
  },
  {
    id: "system-news-feed-ranking",
    title: "Design a news feed ranking system",
    prompt:
      "Design the backend for a personalized news feed. Cover candidate generation, ranking, freshness, and how you would balance relevance with system cost.",
    trackId: "staff-engineering",
    trackLabel: "System Design",
    difficulty: "Stretch",
    interviewer: "Sarah Chen",
    interviewerRole: "VP Engineering",
    interviewerAvatar: AVATAR_SARAH,
    mastery: 16,
    duration: "28 min",
    focus: ["Ranking systems", "Freshness", "Scale"],
    hints: [
      "Clarify whether the feed is read-heavy, write-heavy, or both.",
      "Separate candidate generation from final ranking.",
      "Discuss the tradeoff between precomputation and on-demand ranking.",
      "Name the abuse, latency, and experimentation risks explicitly.",
    ],
    rubric: [
      "Requirement clarity",
      "Component design",
      "Tradeoff reasoning",
      "Scaling awareness",
      "Metric awareness",
    ],
    followUps: [
      "How would you explain the relevance-versus-freshness tradeoff to product leadership?",
      "What signals would you keep out of the first version to reduce complexity?",
    ],
  },
];

const scenarioCategories: Record<string, Scenario["category"]> = {
  "staff-swe-story": "behavioral",
  "staff-swe-mentorship": "behavioral",
  "staff-swe-system-design-intro": "system-design",
  "staff-swe-conflict": "behavioral",
  "staff-swe-incident": "behavioral",
  "staff-swe-tech-strategy": "behavioral",
  "staff-swe-ambiguous-initiative": "behavioral",
  "pm-metric-drop": "behavioral",
  "pm-product-sense": "behavioral",
  "pm-prioritization": "behavioral",
  "pm-stakeholder-pushback": "behavioral",
  "pm-launch-decision": "behavioral",
  "pm-zero-to-one": "behavioral",
  "consulting-market-sizing": "behavioral",
  "consulting-profitability": "behavioral",
  "consulting-market-entry": "behavioral",
  "consulting-client-pushback": "behavioral",
  "consulting-synthesis": "behavioral",
  "consulting-ops-turnaround": "behavioral",
  "technical-two-sum": "technical",
  "technical-valid-parentheses": "technical",
  "technical-merge-intervals": "technical",
  "technical-top-k-frequent": "technical",
  "technical-lru-cache": "technical",
  "technical-word-ladder": "technical",
  "system-url-shortener": "system-design",
  "system-feature-flags": "system-design",
  "system-realtime-chat": "system-design",
  "system-news-feed-ranking": "system-design",
};

const scenarioPatterns: Record<string, Scenario["pattern"]> = {
  "staff-swe-story": "self-intro",
  "staff-swe-mentorship": "coaching-growth",
  "staff-swe-system-design-intro": "retrospective-architecture",
  "staff-swe-conflict": "conflict-influence",
  "staff-swe-incident": "incident-leadership",
  "staff-swe-tech-strategy": "platform-investment",
  "staff-swe-ambiguous-initiative": "ambiguous-charter",
  "pm-metric-drop": "metric-diagnosis",
  "pm-product-sense": "product-improvement",
  "pm-prioritization": "roadmap-prioritization",
  "pm-stakeholder-pushback": "stakeholder-negotiation",
  "pm-launch-decision": "launch-risk-call",
  "pm-zero-to-one": "zero-to-one-bet",
  "consulting-market-sizing": "market-sizing",
  "consulting-profitability": "profitability-tree",
  "consulting-market-entry": "market-entry",
  "consulting-client-pushback": "client-pushback",
  "consulting-synthesis": "recommendation-synthesis",
  "consulting-ops-turnaround": "operations-turnaround",
  "technical-two-sum": "two-sum",
  "technical-valid-parentheses": "valid-parentheses",
  "technical-merge-intervals": "merge-intervals",
  "technical-top-k-frequent": "top-k-frequency",
  "technical-lru-cache": "lru-cache",
  "technical-word-ladder": "word-ladder",
  "system-url-shortener": "url-shortener",
  "system-feature-flags": "feature-flag-platform",
  "system-realtime-chat": "realtime-chat",
  "system-news-feed-ranking": "news-feed-ranking",
};

export const scenarios: Scenario[] = scenarioBank.map((scenario) => ({
  ...scenario,
  category: scenarioCategories[scenario.id] ?? "behavioral",
  pattern: scenarioPatterns[scenario.id] ?? "general",
}));

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
