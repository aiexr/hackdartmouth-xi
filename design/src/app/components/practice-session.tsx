import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  Mic,
  MicOff,
  Clock,
  ChevronRight,
  Lightbulb,
  FileText,
  X,
  Pause,
  SkipForward,
  MessageSquare,
  Volume2,
} from "lucide-react";
import { Progress } from "./ui/progress";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";

const scenarioData: Record<string, {
  title: string;
  question: string;
  interviewer: string;
  role: string;
  avatar: string;
  hints: string[];
  rubric: string[];
  followUps: string[];
}> = {
  behavioral: {
    title: "Tell me about yourself",
    question: "Walk me through your background and what brought you to this point in your career.",
    interviewer: "Sarah Chen",
    role: "Engineering Manager at Stripe",
    avatar: "https://images.unsplash.com/photo-1770058428154-9eee8a6a1fbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGhlYWRzaG90JTIwcG9ydHJhaXQlMjBmcmllbmRseXxlbnwxfHx8fDE3NzU5MjY4OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    hints: [
      "Start with a brief professional summary (30 sec)",
      "Highlight 2-3 key career transitions with 'why'",
      "End with why this role excites you",
      "Keep total response under 2 minutes",
    ],
    rubric: ["Clarity", "Structure (STAR)", "Specificity", "Conciseness", "Confidence"],
    followUps: [
      "What's the biggest challenge you've faced in your career so far?",
      "Why are you looking to leave your current role?",
      "What excites you about this opportunity?",
    ],
  },
  conflict: {
    title: "Describe a conflict at work",
    question: "Tell me about a time you had a disagreement with a colleague. How did you handle it?",
    interviewer: "James Rivera",
    role: "VP of Product at Figma",
    avatar: "https://images.unsplash.com/photo-1762522927402-f390672558d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwY29ycG9yYXRlfGVufDF8fHx8MTc3NTkyNjg5N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    hints: [
      "Choose a real example with a positive resolution",
      "Focus on your role in de-escalating",
      "Show empathy and active listening",
      "Quantify the outcome if possible",
    ],
    rubric: ["Empathy", "Self-awareness", "Resolution", "Specificity", "Maturity"],
    followUps: [
      "What would you do differently in hindsight?",
      "How do you typically approach disagreements?",
    ],
  },
  leadership: {
    title: "Walk me through a leadership moment",
    question: "Describe a time you led a team through a difficult situation.",
    interviewer: "Priya Sharma",
    role: "Director of Engineering at Google",
    avatar: "https://images.unsplash.com/photo-1666867936058-de34bfd5b320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGV4ZWN1dGl2ZSUyMHBvcnRyYWl0JTIwZGl2ZXJzZXxlbnwxfHx8fDE3NzU5MjY4OTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    hints: [
      "Set the context: team size, stakes, timeline",
      "Explain your specific actions as the leader",
      "Share how you motivated or supported the team",
      "Highlight measurable results",
    ],
    rubric: ["Vision", "Decision-making", "Team empowerment", "Impact", "Reflection"],
    followUps: [
      "What was the hardest decision you made during that time?",
      "How did you keep the team motivated?",
    ],
  },
};

const mockTranscript = [
  { speaker: "interviewer", text: "Thanks for joining today. I'd love to start with a classic — walk me through your background." },
  { speaker: "you", text: "Absolutely. I started my career as a frontend engineer at a fintech startup..." },
  { speaker: "you", text: "...where I led the migration from a legacy jQuery codebase to React, reducing page load times by 60%." },
];

export function PracticeSession() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const scenario = scenarioData[scenarioId || "behavioral"] || scenarioData.behavioral;

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isRecording || isPaused) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const progress = ((currentQuestion + 1) / (scenario.followUps.length + 1)) * 100;

  return (
    <div className="h-screen flex flex-col bg-[#FAFAF8]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-[0.8125rem] text-muted-foreground">
            Question {currentQuestion + 1} of {scenario.followUps.length + 1}
          </div>
          <Progress value={progress} className="w-32 h-2" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-[0.875rem] tabular-nums" style={{ fontWeight: 500 }}>{formatTime(seconds)}</span>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Center: Interviewer focus */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          {/* Avatar + question */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center max-w-lg"
          >
            <div className="relative mb-6">
              <ImageWithFallback
                src={scenario.avatar}
                alt={scenario.interviewer}
                className="w-28 h-28 rounded-full object-cover shadow-lg ring-4 ring-white"
              />
              {isRecording && !isPaused && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center shadow-md"
                >
                  <Volume2 className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </div>
            <p className="text-[0.875rem] text-muted-foreground mb-1">
              {scenario.interviewer} &middot; {scenario.role}
            </p>
            <h2 className="text-foreground mb-2">{scenario.title}</h2>
            <motion.p
              key={currentQuestion}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground text-[1.0625rem] leading-relaxed"
            >
              {currentQuestion === 0
                ? scenario.question
                : scenario.followUps[currentQuestion - 1]}
            </motion.p>
          </motion.div>

          {/* Recording controls */}
          <div className="flex items-center gap-4">
            {isRecording && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Pause className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 scale-110"
                  : "bg-primary hover:opacity-90"
              }`}
            >
              {isRecording ? (
                <MicOff className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-white" />
              )}
            </button>
            {isRecording && (
              <button
                onClick={() => {
                  if (currentQuestion < scenario.followUps.length) {
                    setCurrentQuestion((q) => q + 1);
                  } else {
                    navigate(`/review/${scenarioId}`);
                  }
                }}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <SkipForward className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
          {!isRecording && (
            <p className="text-[0.875rem] text-muted-foreground">
              Tap the mic to start recording your response
            </p>
          )}
          {isRecording && (
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={!isPaused ? { height: [8, 24, 8] } : {}}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6,
                    delay: i * 0.1,
                  }}
                  className="w-1 bg-primary rounded-full"
                  style={{ height: 8 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Side panels */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-card overflow-y-auto">
          {/* Panel toggles */}
          <div className="flex border-b border-border">
            <button
              onClick={() => { setShowHints(true); setShowTranscript(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[0.875rem] border-b-2 transition-colors ${
                showHints ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              Hints
            </button>
            <button
              onClick={() => { setShowTranscript(true); setShowHints(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[0.875rem] border-b-2 transition-colors ${
                showTranscript ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" />
              Transcript
            </button>
            <button
              onClick={() => { setShowHints(false); setShowTranscript(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[0.875rem] border-b-2 transition-colors ${
                !showHints && !showTranscript ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Rubric
            </button>
          </div>

          <div className="p-5">
            {showHints && (
              <div className="space-y-3">
                <p className="text-[0.8125rem] text-muted-foreground mb-3">
                  Tips to strengthen your response:
                </p>
                {scenario.hints.map((hint, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 text-[0.75rem]" style={{ fontWeight: 600 }}>
                      {i + 1}
                    </div>
                    <p className="text-[0.875rem] text-foreground">{hint}</p>
                  </div>
                ))}
              </div>
            )}

            {showTranscript && (
              <div className="space-y-4">
                {mockTranscript.map((line, i) => (
                  <div key={i} className={`flex gap-3 ${line.speaker === "you" ? "flex-row-reverse text-right" : ""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] ${
                      line.speaker === "you" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`} style={{ fontWeight: 600 }}>
                      {line.speaker === "you" ? "Y" : "I"}
                    </div>
                    <p className={`text-[0.875rem] rounded-2xl px-4 py-2.5 ${
                      line.speaker === "you" ? "bg-primary/5" : "bg-muted"
                    }`}>
                      {line.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!showHints && !showTranscript && (
              <div className="space-y-3">
                <p className="text-[0.8125rem] text-muted-foreground mb-3">
                  You'll be scored on these dimensions:
                </p>
                {scenario.rubric.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-[0.875rem]">{item}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <div
                          key={dot}
                          className="w-2 h-2 rounded-full bg-muted"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Finish button */}
      {isRecording && (
        <div className="px-6 py-3 bg-card border-t border-border flex justify-center">
          <button
            onClick={() => navigate(`/review/${scenarioId}`)}
            className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Finish & Get Feedback
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
