import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Star,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  RotateCcw,
  Home,
  ChevronRight,
  Sparkles,
  Award,
} from "lucide-react";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";

const feedbackData: Record<string, {
  title: string;
  overallScore: number;
  previousScore: number;
  dimensions: { name: string; score: number; max: number; change: number }[];
  strengths: string[];
  improvements: string[];
  tips: string[];
  transcript: { time: string; text: string; highlight?: "strength" | "improve" }[];
}> = {
  behavioral: {
    title: "Tell me about yourself",
    overallScore: 78,
    previousScore: 65,
    dimensions: [
      { name: "Clarity", score: 85, max: 100, change: 12 },
      { name: "Structure (STAR)", score: 72, max: 100, change: 8 },
      { name: "Specificity", score: 80, max: 100, change: 15 },
      { name: "Conciseness", score: 68, max: 100, change: -2 },
      { name: "Confidence", score: 82, max: 100, change: 10 },
    ],
    strengths: [
      "Strong opening that immediately establishes professional identity",
      "Good use of specific metrics (60% load time reduction)",
      "Natural transition between career stages",
    ],
    improvements: [
      "Your closing could tie more directly to the role you're interviewing for",
      "Consider trimming the middle section — you spent 45s on one project",
      "Add a brief mention of what motivates you beyond technical skills",
    ],
    tips: [
      "Practice the '30-60-30' rule: 30s past, 60s present, 30s future",
      "Mirror the job description language in your response",
      "End with enthusiasm: 'That's why I'm excited about this role because...'",
    ],
    transcript: [
      { time: "0:03", text: "I started my career as a frontend engineer at a fintech startup where I discovered my passion for building user-centric products.", highlight: "strength" },
      { time: "0:18", text: "There, I led the migration from a legacy jQuery codebase to React, which reduced page load times by 60% and improved our NPS score by 20 points.", highlight: "strength" },
      { time: "0:35", text: "After that, I moved to a mid-size company where I worked on a lot of different things including backend, frontend, DevOps, and also some machine learning projects.", highlight: "improve" },
      { time: "1:02", text: "Currently, I'm a senior engineer focusing on design systems and component architecture." },
      { time: "1:15", text: "I really enjoy building things that other engineers use to be more productive." },
    ],
  },
};

const defaultFeedback = feedbackData.behavioral;

export function ReviewFeedback() {
  const { scenarioId } = useParams();
  const feedback = feedbackData[scenarioId || "behavioral"] || defaultFeedback;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[0.875rem]">Dashboard</span>
          </Link>
          <h3>{feedback.title}</h3>
          <div className="flex gap-2">
            <Link
              to={`/practice/${scenarioId}`}
              className="flex items-center gap-1.5 text-[0.875rem] px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </Link>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-[0.875rem] px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Home className="w-3.5 h-3.5" />
              Done
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="text-[0.875rem] text-muted-foreground">Session Complete</span>
          </div>
          <div className="relative w-36 h-36 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#F0EFFC" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="50"
                fill="none" stroke="#4F46E5" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="314"
                initial={{ strokeDashoffset: 314 }}
                animate={{ strokeDashoffset: 314 - (feedback.overallScore / 100) * 314 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[2.25rem] text-foreground" style={{ fontWeight: 700 }}>{feedback.overallScore}</span>
              <span className="text-[0.75rem] text-muted-foreground">out of 100</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[0.875rem]" style={{ fontWeight: 500 }}>
              +{feedback.overallScore - feedback.previousScore} points from last attempt
            </span>
          </div>
          <p className="text-muted-foreground mt-2 text-[0.875rem]">
            Great improvement! Your structure and specificity are getting noticeably stronger.
          </p>
        </motion.div>

        {/* Dimension scores */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="flex items-center gap-2 mb-5">
            <Star className="w-5 h-5 text-primary" />
            Score Breakdown
          </h3>
          <div className="space-y-4">
            {feedback.dimensions.map((dim, i) => (
              <motion.div
                key={dim.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[0.875rem]">{dim.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem]" style={{ fontWeight: 500 }}>{dim.score}</span>
                    <span className={`text-[0.75rem] ${dim.change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {dim.change >= 0 ? "+" : ""}{dim.change}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${dim.score}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="flex items-center gap-2 mb-4 text-emerald-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              What You Did Well
            </h3>
            <div className="space-y-3">
              {feedback.strengths.map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <p className="text-[0.875rem] text-foreground">{s}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="flex items-center gap-2 mb-4 text-amber-700">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Areas to Improve
            </h3>
            <div className="space-y-3">
              {feedback.improvements.map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <p className="text-[0.875rem] text-foreground">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actionable Tips */}
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-200/50 p-6">
          <h3 className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-violet-500" />
            Actionable Tips
          </h3>
          <div className="space-y-3">
            {feedback.tips.map((tip, i) => (
              <div key={i} className="flex gap-3 items-start bg-white/60 rounded-xl p-3.5">
                <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                <p className="text-[0.875rem] text-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Annotated Transcript */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="mb-5">Annotated Transcript</h3>
          <div className="space-y-3">
            {feedback.transcript.map((line, i) => (
              <div
                key={i}
                className={`flex gap-4 items-start p-3.5 rounded-xl transition-colors ${
                  line.highlight === "strength"
                    ? "bg-emerald-50 border border-emerald-200/50"
                    : line.highlight === "improve"
                    ? "bg-amber-50 border border-amber-200/50"
                    : "bg-muted/50"
                }`}
              >
                <span className="text-[0.75rem] text-muted-foreground tabular-nums shrink-0 pt-0.5" style={{ fontWeight: 500 }}>
                  {line.time}
                </span>
                <p className="text-[0.875rem] text-foreground flex-1">{line.text}</p>
                {line.highlight && (
                  <div className={`shrink-0 ${
                    line.highlight === "strength" ? "text-emerald-500" : "text-amber-500"
                  }`}>
                    {line.highlight === "strength" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Next steps */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6">
          <Link
            to={`/practice/${scenarioId}`}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Practice Again
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Next Scenario
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
