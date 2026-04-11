import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Play,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import {
  featuredScenarios,
  improvementThemes,
  roleTracks,
  weeklyGoals,
} from "@/data/scenarios";
import { MainShell } from "@/components/app/main-shell";
import { StatusGrid } from "@/components/app/status-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  return (
    <MainShell>
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <Card className="overflow-hidden border-none bg-gradient-to-br from-white via-white to-indigo-50/70 shadow-[0_35px_90px_-50px_rgba(79,70,229,0.45)]">
            <CardContent className="p-7 md:p-8">
              <Badge className="border-primary/10 bg-primary/8 text-primary">
                Role-specific mock interview practice
              </Badge>
              <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <h1 className="max-w-2xl">
                    Practice interviewing the way LeetCode lets you practice problem types.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                    Choose a role track, jump into a repeatable interview scenario, and review visible progress over time. The MVP keeps the experience realistic and structured while the backend integrations stay intentionally scaffolded.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild size="lg">
                      <Link href={`/practice/${featuredScenarios[0].id}`}>
                        <Play className="size-4" />
                        Start quick practice
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link href="/auth/sign-in">
                        Open auth shell
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[1.75rem] border border-border/70 bg-white/80 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Target className="size-4" />
                      Weekly progress
                    </div>
                    <div className="mt-5 flex items-center gap-4">
                      <div className="relative flex size-28 items-center justify-center">
                        <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="#e7e7f5"
                            strokeWidth="10"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="#4f46e5"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${(2 / 4) * 327} 327`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-semibold">2/4</span>
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            loops
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm leading-6 text-muted-foreground">
                          Two more interview loops puts this week back on track.
                        </p>
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                          <Zap className="size-4" />
                          7-day streak active
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-border/70 bg-white/80 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                      <TrendingUp className="size-4" />
                      Current goals
                    </div>
                    <div className="mt-4 space-y-4">
                      {weeklyGoals.map((goal) => (
                        <div key={goal.label}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                            <span>{goal.label}</span>
                            <span className="text-muted-foreground">
                              {goal.current}/{goal.total}
                            </span>
                          </div>
                          <Progress value={(goal.current / goal.total) * 100} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <StatusGrid />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2">
                <Zap className="size-5 text-primary" />
                Suggested interview loops
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The layout and pacing come directly from the design output in `design/`.
              </p>
            </div>
            <Button variant="ghost" className="hidden md:inline-flex">
              View all
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {featuredScenarios.map((scenario) => (
              <Link key={scenario.id} href={`/practice/${scenario.id}`}>
                <Card className="h-full bg-white/85 transition-all hover:-translate-y-0.5 hover:border-primary/25">
                  <CardContent className="flex h-full gap-4 p-5">
                    <img
                      src={scenario.interviewerAvatar}
                      alt={scenario.interviewer}
                      className="size-14 rounded-full object-cover shadow-md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{scenario.difficulty}</Badge>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {scenario.trackLabel}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg">{scenario.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {scenario.interviewer} · {scenario.interviewerRole}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {scenario.prompt}
                      </p>
                    </div>
                    <div className="hidden w-28 shrink-0 flex-col justify-between sm:flex">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                          <span>Mastery</span>
                          <span>{scenario.mastery}%</span>
                        </div>
                        <Progress value={scenario.mastery} />
                      </div>
                      <div className="text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {scenario.duration}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="size-5 text-primary" />
              <h2>Role tracks</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {roleTracks.map((track) => (
                <Card key={track.id} className="bg-white/80">
                  <CardContent className="p-5">
                    <div
                      className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${track.gradient} text-white shadow-lg`}
                    >
                      <Trophy className="size-5" />
                    </div>
                    <h3 className="mt-4 text-lg">{track.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {track.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {track.completed} of {track.total} completed
                      </span>
                      <span className="font-semibold text-foreground">
                        {Math.round((track.completed / track.total) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(track.completed / track.total) * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="size-5 text-amber-500" />
              <h2>Learn from recent misses</h2>
            </div>
            <div className="space-y-4">
              {improvementThemes.map((item) => (
                <Card key={item.id} className="bg-white/80">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                        {item.tag}
                      </Badge>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {item.source}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </MainShell>
  );
}
