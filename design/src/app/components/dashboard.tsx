import { Link } from "react-router";
import {
  Play,
  ArrowRight,
  Target,
  TrendingUp,
  Clock,
  Lightbulb,
  ChevronRight,
  Zap,
  CheckCircle2,
  BookOpen,
  Trophy,
} from "lucide-react";
import { Progress } from "./ui/progress";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const scenarios = [
  {
    id: "behavioral",
    title: "Tell me about yourself",
    category: "Behavioral",
    difficulty: "Beginner",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    interviewer: "Sarah Chen",
    role: "Engineering Manager",
    avatar: "https://images.unsplash.com/photo-1770058428154-9eee8a6a1fbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGhlYWRzaG90JTIwcG9ydHJhaXQlMjBmcmllbmRseXxlbnwxfHx8fDE3NzU5MjY4OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    mastery: 65,
  },
  {
    id: "conflict",
    title: "Describe a conflict at work",
    category: "Behavioral",
    difficulty: "Intermediate",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    interviewer: "James Rivera",
    role: "VP of Product",
    avatar: "https://images.unsplash.com/photo-1762522927402-f390672558d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwY29ycG9yYXRlfGVufDF8fHx8MTc3NTkyNjg5N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    mastery: 30,
  },
  {
    id: "leadership",
    title: "Walk me through a leadership moment",
    category: "Leadership",
    difficulty: "Advanced",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    interviewer: "Priya Sharma",
    role: "Director of Engineering",
    avatar: "https://images.unsplash.com/photo-1666867936058-de34bfd5b320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGV4ZWN1dGl2ZSUyMHBvcnRyYWl0JTIwZGl2ZXJzZXxlbnwxfHx8fDE3NzU5MjY4OTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    mastery: 10,
  },
];

const mistakes = [
  {
    id: 1,
    title: "Vague STAR responses",
    description: "Your 'Result' sections often lack specific metrics. Try quantifying impact next time.",
    scenario: "Tell me about yourself",
    tag: "Structure",
  },
  {
    id: 2,
    title: "Rushed pacing",
    description: "You spoke 40% faster than optimal. Practice pausing between key points.",
    scenario: "Describe a conflict",
    tag: "Delivery",
  },
];

const goals = [
  { label: "Complete 3 sessions this week", current: 1, total: 3 },
  { label: "Master 'Tell me about yourself'", current: 65, total: 100 },
  { label: "Improve clarity score to 85+", current: 72, total: 85 },
];

export function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Good morning, Alex</h1>
          <p className="text-muted-foreground mt-1">
            Ready to level up your interview skills?
          </p>
        </div>
        <Link
          to="/practice/behavioral"
          className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Play className="w-4 h-4" />
          Quick Practice
        </Link>
      </div>

      {/* Top row: Suggested + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Suggested Scenarios */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Suggested for You
            </h2>
            <button className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[0.875rem]">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {scenarios.map((s) => (
              <Link
                key={s.id}
                to={`/practice/${s.id}`}
                className="group flex items-center gap-4 bg-card rounded-2xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <ImageWithFallback
                  src={s.avatar}
                  alt={s.interviewer}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[0.6875rem] px-2 py-0.5 rounded-full border ${s.color}`} style={{ fontWeight: 500 }}>
                      {s.difficulty}
                    </span>
                    <span className="text-[0.75rem] text-muted-foreground">{s.category}</span>
                  </div>
                  <h4 className="truncate">{s.title}</h4>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    with {s.interviewer} &middot; {s.role}
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-2">
                  <div className="w-20">
                    <div className="flex justify-between text-[0.6875rem] text-muted-foreground mb-1">
                      <span>Mastery</span>
                      <span>{s.mastery}%</span>
                    </div>
                    <Progress value={s.mastery} className="h-1.5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Progress Ring + Goals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Progress + Streak */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Progress Section */}
            <div className="p-6 text-center border-b border-border">
              <h3 className="flex items-center justify-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                Weekly Progress
              </h3>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none" stroke="#F0EFFC" strokeWidth="10"
                  />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none" stroke="#4F46E5" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(1 / 3) * 314} 314`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[1.75rem] text-foreground" style={{ fontWeight: 700 }}>1/3</span>
                  <span className="text-[0.75rem] text-muted-foreground">sessions</span>
                </div>
              </div>
              <p className="text-[0.875rem] text-muted-foreground">
                2 more sessions to hit your weekly goal
              </p>
            </div>

            {/* Streak Section */}
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white fill-white" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[1.5rem] text-foreground" style={{ fontWeight: 700 }}>7</span>
                      <span className="text-[0.875rem] text-muted-foreground">day streak</span>
                    </div>
                    <p className="text-[0.75rem] text-muted-foreground">Keep the momentum going!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Goals */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Current Goals
            </h3>
            <div className="space-y-4">
              {goals.map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[0.8125rem] mb-1.5">
                    <span className="text-foreground">{g.label}</span>
                    <span className="text-muted-foreground">
                      {g.current}/{g.total}
                    </span>
                  </div>
                  <Progress
                    value={(g.current / g.total) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Learn from Mistakes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Learn from Mistakes
          </h2>
          <button className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[0.875rem]">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mistakes.map((m) => (
            <div
              key={m.id}
              className="bg-card rounded-2xl border border-border p-5 hover:border-amber-200 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[0.6875rem] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200" style={{ fontWeight: 500 }}>
                  {m.tag}
                </span>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </div>
              <h4 className="mb-1">{m.title}</h4>
              <p className="text-[0.8125rem] text-muted-foreground mb-3">
                {m.description}
              </p>
              <div className="flex items-center gap-2 text-[0.75rem] text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                From: {m.scenario}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role-based Tracks */}
      <div>
        <h2 className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Scenario Tracks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: "Behavioral Fundamentals", done: 4, total: 8, color: "from-emerald-500 to-teal-500" },
            { name: "Leadership & Strategy", done: 1, total: 6, color: "from-violet-500 to-purple-500" },
            { name: "Technical Communication", done: 2, total: 5, color: "from-blue-500 to-cyan-500" },
          ].map((track) => (
            <div
              key={track.name}
              className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${track.color} flex items-center justify-center mb-3`}>
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h4 className="mb-1">{track.name}</h4>
              <p className="text-[0.8125rem] text-muted-foreground mb-3">
                {track.done} of {track.total} scenarios completed
              </p>
              <Progress value={(track.done / track.total) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}