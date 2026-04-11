import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Play,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import {
  improvementThemes,
  roleTracks,
  weeklyGoals,
} from "@/data/scenarios";
import { MainShell } from "@/components/app/main-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  return (
    <MainShell>
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden">
            <CardContent className="p-7 md:p-8">
              <Badge className="bg-secondary text-secondary-foreground">
                Role-specific mock interview practice
              </Badge>
              <div className="mt-5">
                <h1 className="max-w-2xl">
                  Practice interviewing the way LeetCode lets you practice problem types.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                  Choose a role track, jump into a repeatable interview scenario, and review visible progress over time. The MVP keeps the experience realistic and structured while the backend integrations stay intentionally scaffolded.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href="/practice">
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
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
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
                      stroke="#f0effc"
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
                  <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                    <Zap className="size-4" />
                    7-day streak active
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground">
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
        </section>



        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="size-5 text-primary" />
              <h2>Role tracks</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {roleTracks.map((track) => (
                <Card key={track.id}>
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
                <Card key={item.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <Badge className="bg-accent text-accent-foreground">
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
