import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronRight,
  Home,
  Lightbulb,
  RotateCcw,
  Star,
  TrendingUp,
} from "lucide-react";
import { getReviewByScenarioId, getScenarioById } from "@/data/scenarios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const scenario = getScenarioById(scenarioId);
  const review = getReviewByScenarioId(scenarioId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <h3 className="hidden text-base md:block">{scenario.title}</h3>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href={`/practice/${scenario.id}`}>
                <RotateCcw className="size-4" />
                Retry
              </Link>
            </Button>
            <Button asChild>
              <Link href="/">
                <Home className="size-4" />
                Done
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <Card className="bg-white/85 text-center">
          <CardContent className="p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
              <Award className="size-4" />
              Session complete
            </div>

            <div className="mx-auto mt-6 flex size-40 items-center justify-center rounded-full border-[12px] border-secondary bg-white shadow-lg shadow-primary/10">
              <div>
                <div className="text-5xl font-semibold">{review.overallScore}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  out of 100
                </div>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <TrendingUp className="size-4" />
              {review.overallScore - review.previousScore} points from the last attempt
            </div>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              The scorecard is static for the MVP, but the layout is already prepared for Gemini-generated rubric feedback and transcript annotations.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/85">
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2">
              <Star className="size-5 text-primary" />
              Score breakdown
            </h2>
            <div className="mt-5 space-y-4">
              {review.dimensions.map((dimension) => (
                <div key={dimension.name}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span>{dimension.name}</span>
                    <span className="font-medium">
                      {dimension.score}
                      <span
                        className={`ml-2 text-xs font-semibold ${
                          dimension.change >= 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {dimension.change >= 0 ? "+" : ""}
                        {dimension.change}
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-primary/12">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${dimension.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/80">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="size-5 text-emerald-500" />
                What landed
              </h2>
              <div className="mt-4 space-y-3">
                {review.strengths.map((item) => (
                  <p key={item} className="flex gap-3 text-sm leading-6">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="size-5 text-amber-500" />
                What to tighten
              </h2>
              <div className="mt-4 space-y-3">
                {review.improvements.map((item) => (
                  <p key={item} className="flex gap-3 text-sm leading-6">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-violet-200/70 bg-gradient-to-br from-violet-50 to-indigo-50">
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2">
              <Lightbulb className="size-5 text-violet-500" />
              Actionable tips
            </h2>
            <div className="mt-4 space-y-3">
              {review.tips.map((item) => (
                <div key={item} className="rounded-[1.35rem] bg-white/70 px-4 py-3 text-sm leading-6">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/85">
          <CardContent className="p-6">
            <h2>Annotated transcript</h2>
            <div className="mt-5 space-y-3">
              {review.transcript.map((line) => (
                <div
                  key={`${line.time}-${line.text}`}
                  className={`flex items-start gap-4 rounded-[1.35rem] border px-4 py-3 ${
                    line.highlight === "strength"
                      ? "border-emerald-200/70 bg-emerald-50"
                      : line.highlight === "improve"
                        ? "border-amber-200/70 bg-amber-50"
                        : "border-border bg-muted/45"
                  }`}
                >
                  <span className="pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {line.time}
                  </span>
                  <p className="flex-1 text-sm leading-6">{line.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="secondary" size="lg">
            <Link href={`/practice/${scenario.id}`}>
              <RotateCcw className="size-4" />
              Practice again
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/">
              Next scenario
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
