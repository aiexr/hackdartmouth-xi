import Link from "next/link";
import { ObjectId } from "mongodb";
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
import { getOptionalServerSession } from "@/lib/auth";
import { getOptionalMongoDb } from "@/lib/mongodb";
import { getReviewByScenarioId, getScenarioById } from "@/data/scenarios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type PersistedInterview = {
  scenarioId?: string | null;
  overallScore?: number | null;
  letterGrade?: string | null;
  gradingError?: string | null;
  gradingResult?: {
    dimensions?: Array<{ name?: string; score?: number; feedback?: string }>;
    strengths?: string[];
    improvements?: string[];
    key_moments?: Array<{
      timestamp?: string;
      type?: "strength" | "improvement" | "note";
      description?: string;
    }>;
    diagram_analysis?: {
      description?: string;
      strengths?: string[];
      improvements?: string[];
      key_points?: string[];
    };
  } | null;
  transcript?: Array<{
    role?: string;
    content?: string;
    timestamp?: string;
    step?: number;
  }> | null;
  codeSnapshot?: string | null;
  diagramSnapshot?: string | null;
};

type PersistedKeyMoment = {
  timestamp?: string;
  type?: "strength" | "improvement" | "note";
  description?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeTranscript(
  transcript: PersistedInterview["transcript"],
  interviewerName: string,
  keyMoments?: PersistedKeyMoment[] | null,
) {
  const keyMomentByTimestamp = new Map(
    Array.isArray(keyMoments)
      ? keyMoments
          .filter(
            (
              moment,
            ): moment is { timestamp: string; type?: "strength" | "improvement" | "note"; description?: string } =>
              Boolean(moment && isNonEmptyString(moment.timestamp)),
          )
          .map((moment) => [moment.timestamp, moment])
      : [],
  );

  if (!Array.isArray(transcript)) {
    return [];
  }

  return transcript
    .map((turn) => {
      if (!turn || !isNonEmptyString(turn.content)) {
        return null;
      }

      const timestamp = isNonEmptyString(turn.timestamp) ? turn.timestamp : "--";
      const moment = keyMomentByTimestamp.get(timestamp);

      return {
        time: timestamp,
        speaker: turn.role === "user" ? "You" : interviewerName,
        text: turn.content.trim(),
        note: isNonEmptyString(moment?.description) ? moment.description : null,
        highlight:
          moment?.type === "strength"
            ? ("strength" as const)
            : moment?.type === "improvement"
              ? ("improve" as const)
              : undefined,
      };
    })
    .filter(
      (
        turn,
      ): turn is {
        time: string;
        speaker: string;
        text: string;
        note: string | null;
        highlight: "strength" | "improve" | undefined;
      } => Boolean(turn),
    );
}

async function getPersistedInterviewReview(
  interviewId: string,
  scenarioId: string,
  userEmail: string,
) {
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(interviewId);
  } catch {
    return {
      interview: null,
      previousScore: null,
      notice: "The saved review link was invalid, so the demo scorecard is shown instead.",
    };
  }

  const db = await getOptionalMongoDb();
  if (!db) {
    return {
      interview: null,
      previousScore: null,
      notice: "MongoDB is unavailable, so this review fell back to the demo scorecard.",
    };
  }

  const interview = (await db.collection("interviews").findOne({
    _id: objectId,
    userId: userEmail,
    scenarioId,
  })) as PersistedInterview | null;

  if (!interview) {
    return {
      interview: null,
      previousScore: null,
      notice: "That saved interview could not be found. Showing the demo review instead.",
    };
  }

  const previousInterview = (await db
    .collection("interviews")
    .find({
      userId: userEmail,
      scenarioId,
      status: "completed",
      overallScore: { $type: "number" },
      _id: { $ne: objectId },
    })
    .sort({ completedAt: -1, createdAt: -1 })
    .limit(1)
    .toArray()) as PersistedInterview[];

  const previousScore =
    typeof previousInterview[0]?.overallScore === "number"
      ? previousInterview[0].overallScore
      : null;

  return {
    interview,
    previousScore,
    notice: null,
  };
}

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ scenarioId: string }>;
  searchParams: Promise<{ interviewId?: string; grading?: string }>;
}) {
  const { scenarioId } = await params;
  const { interviewId, grading } = await searchParams;
  const scenario = getScenarioById(scenarioId);
  const staticReview = getReviewByScenarioId(scenarioId);
  const session = await getOptionalServerSession();

  const persistedReview =
    interviewId && session?.user?.email
      ? await getPersistedInterviewReview(interviewId, scenario.id, session.user.email)
      : null;

  const interview = persistedReview?.interview ?? null;
  const hasPersistedReview = Boolean(interview);
  const overallScore =
    hasPersistedReview && typeof interview?.overallScore === "number"
      ? interview.overallScore
      : null;
  const previousScore = hasPersistedReview ? persistedReview?.previousScore ?? null : null;
  const scoreDelta =
    overallScore !== null && previousScore !== null ? overallScore - previousScore : null;
  const dimensions =
    hasPersistedReview && Array.isArray(interview?.gradingResult?.dimensions)
      ? interview.gradingResult.dimensions
          .filter(
            (
              item,
            ): item is {
              name: string;
              score: number;
              feedback?: string;
            } => Boolean(item && isNonEmptyString(item.name) && typeof item.score === "number"),
          )
          .map((item) => ({
            name: item.name,
            score: Math.max(0, Math.min(100, Math.round(item.score))),
            feedback: isNonEmptyString(item.feedback) ? item.feedback : null,
          }))
      : [];
  const strengths =
    hasPersistedReview && Array.isArray(interview?.gradingResult?.strengths)
      ? interview.gradingResult.strengths.filter(isNonEmptyString)
      : staticReview.strengths;
  const improvements =
    hasPersistedReview && Array.isArray(interview?.gradingResult?.improvements)
      ? interview.gradingResult.improvements.filter(isNonEmptyString)
      : staticReview.improvements;
  const tips =
    hasPersistedReview && improvements.length
      ? improvements.slice(0, 3)
      : staticReview.tips;
  const transcript =
    hasPersistedReview
      ? normalizeTranscript(
          interview?.transcript,
          scenario.interviewer,
          interview?.gradingResult?.key_moments,
        )
      : staticReview.transcript.map((line) => ({
          time: line.time,
          speaker: scenario.interviewer,
          text: line.text,
          note: null,
          highlight: line.highlight,
        }));
  const scoreDisplay = hasPersistedReview ? (overallScore ?? "--") : staticReview.overallScore;

  const reviewNotice =
    persistedReview?.notice ??
    (grading === "pending"
      ? "Transcript saved, but AI scoring was unavailable for this attempt."
      : null);

  return (
    <div className="min-h-screen bg-base-200">
      <header className="border-b border-border bg-base-100/80 px-6 py-4 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-base-content/60 transition hover:text-base-content"
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
        {reviewNotice ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex gap-3 p-4 text-sm leading-6 text-amber-900">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{reviewNotice}</span>
            </CardContent>
          </Card>
        ) : null}

        {hasPersistedReview && interview?.gradingResult?.diagram_analysis ? (
          <Card className="bg-base-100/85">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2">
                <Lightbulb className="size-5 text-violet-500" />
                Diagram analysis
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-6 text-base-content/60">
                {interview.gradingResult.diagram_analysis.description ? (
                  <p>{interview.gradingResult.diagram_analysis.description}</p>
                ) : null}

                {Array.isArray(interview.gradingResult.diagram_analysis.strengths) && interview.gradingResult.diagram_analysis.strengths.length ? (
                  <div>
                    <strong>Diagram strengths:</strong>
                    <ul className="mt-2 list-inside list-disc">
                      {interview.gradingResult.diagram_analysis.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {Array.isArray(interview.gradingResult.diagram_analysis.improvements) && interview.gradingResult.diagram_analysis.improvements.length ? (
                  <div>
                    <strong>Diagram improvements:</strong>
                    <ul className="mt-2 list-inside list-disc">
                      {interview.gradingResult.diagram_analysis.improvements.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {Array.isArray(interview.gradingResult.diagram_analysis.key_points) && interview.gradingResult.diagram_analysis.key_points.length ? (
                  <div>
                    <strong>Key points:</strong>
                    <ul className="mt-2 list-inside list-disc">
                      {interview.gradingResult.diagram_analysis.key_points.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="bg-base-100/85 text-center">
          <CardContent className="p-8">
            <div className="inline-flex items-center gap-2 rounded-none bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
              <Award className="size-4" />
              Session complete
            </div>

            <div className="mx-auto mt-6 flex size-40 items-center justify-center rounded-none border-12 border-border bg-base-100 shadow-lg shadow-primary/10">
              <div>
                <div className="text-5xl font-semibold">{scoreDisplay}</div>
                <div className="text-xs font-medium text-base-content/60">
                  {overallScore !== null || !hasPersistedReview ? "out of 100" : "score pending"}
                </div>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <TrendingUp className="size-4" />
              {hasPersistedReview ? (
                scoreDelta !== null ? (
                  <>
                    {scoreDelta >= 0 ? "+" : ""}
                    {scoreDelta} points from your previous scored attempt
                  </>
                ) : overallScore !== null ? (
                  <>First scored attempt for this scenario</>
                ) : (
                  <>Transcript saved successfully, but scoring is still pending</>
                )
              ) : (
                <>{staticReview.overallScore - staticReview.previousScore} points from the last attempt</>
              )}
            </div>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-base-content/60">
              {hasPersistedReview ? (
                interview?.gradingError ? (
                  <>Your transcript was saved, but AI scoring failed: {interview.gradingError}</>
                ) : overallScore !== null ? (
                  <>This scorecard is generated from your saved transcript and rubric evaluation.</>
                ) : (
                  <>This attempt saved the transcript, but the grading model did not return a score.</>
                )
              ) : (
                <>
                  The scorecard is static for the MVP, but the layout is already prepared for Gemini-generated rubric feedback and transcript annotations.
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-base-100/85">
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2">
              <Star className="size-5 text-primary" />
              Score breakdown
            </h2>
            {hasPersistedReview && !dimensions.length ? (
              <p className="mt-5 text-sm leading-6 text-base-content/60">
                Dimension-level feedback is unavailable for this attempt because the scoring model did not return a rubric breakdown.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {(hasPersistedReview
                  ? dimensions
                  : staticReview.dimensions.map((dimension) => ({
                      name: dimension.name,
                      score: dimension.score,
                      feedback: null,
                      change: dimension.change,
                    }))).map((dimension) => (
                  <div key={dimension.name}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span>{dimension.name}</span>
                      <span className="font-medium">
                        {dimension.score}
                        {"change" in dimension && typeof dimension.change === "number" ? (
                          <span
                            className={`ml-2 text-xs font-semibold ${
                              dimension.change >= 0 ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {dimension.change >= 0 ? "+" : ""}
                            {dimension.change}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-none bg-primary/12">
                      <div
                        className="h-full rounded-none bg-primary"
                        style={{ width: `${dimension.score}%` }}
                      />
                    </div>
                    {"feedback" in dimension && dimension.feedback ? (
                      <p className="mt-2 text-sm leading-6 text-base-content/60">
                        {dimension.feedback}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-base-100/80">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="size-5 text-emerald-500" />
                What landed
              </h2>
              <div className="mt-4 space-y-3">
                {strengths.length ? (
                  strengths.map((item) => (
                    <p key={item} className="flex gap-3 text-sm leading-6">
                      <span className="mt-2 size-1.5 shrink-0 rounded-none bg-emerald-400" />
                      <span>{item}</span>
                    </p>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-base-content/60">
                    No strengths were returned for this attempt.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-base-100/80">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="size-5 text-amber-500" />
                What to tighten
              </h2>
              <div className="mt-4 space-y-3">
                {improvements.length ? (
                  improvements.map((item) => (
                    <p key={item} className="flex gap-3 text-sm leading-6">
                      <span className="mt-2 size-1.5 shrink-0 rounded-none bg-amber-400" />
                      <span>{item}</span>
                    </p>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-base-content/60">
                    No improvement areas were returned for this attempt.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-primary/20 bg-base-100/85">
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2 text-base-content">
              <Lightbulb className="size-5 text-primary" />
              Actionable tips
            </h2>
            <div className="mt-4 space-y-3">
              {tips.map((item) => (
                <div
                  key={item}
                  className="rounded-none border border-border/70 bg-base-200/55 px-4 py-3 text-sm leading-6 text-base-content"
                >
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {hasPersistedReview && interview?.codeSnapshot ? (
          <Card className="bg-base-100/85">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2">
                Your Code
              </h2>
              <pre className="mt-4 overflow-x-auto rounded-none bg-base-200/60 p-4 font-mono text-sm leading-6">
                {interview.codeSnapshot}
              </pre>
            </CardContent>
          </Card>
        ) : null}

        {hasPersistedReview && interview?.diagramSnapshot ? (
          <Card className="bg-base-100/85">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2">
                Your System Design
              </h2>
              <div className="mt-4 overflow-hidden rounded-none border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={interview.diagramSnapshot}
                  alt="System design whiteboard diagram"
                  className="w-full"
                />
              </div>
              {isNonEmptyString(interview?.gradingResult?.diagram_analysis?.description) ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {interview.gradingResult.diagram_analysis.description}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card className="bg-base-100/85">
          <CardContent className="p-6">
            <h2>Annotated transcript</h2>
            <div className="mt-5 space-y-3">
              {transcript.length ? (
                transcript.map((line) => (
                  <div
                    key={`${line.time}-${line.speaker}-${line.text}`}
                    className={`rounded-none border px-4 py-3 ${
                      line.highlight === "strength"
                        ? "border-emerald-200/70 bg-emerald-50"
                        : line.highlight === "improve"
                          ? "border-amber-200/70 bg-amber-50"
                          : "border-border bg-base-200/45"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="pt-1 text-xs font-medium text-base-content/60">
                        {line.time}
                      </span>
                      <div className="flex-1">
                        <div className="mb-1 text-xs font-medium text-base-content/60">
                          {line.speaker}
                        </div>
                        <p className="text-sm leading-6">{line.text}</p>
                        {line.note ? (
                          <p className="mt-2 text-sm leading-6 text-base-content/60">
                            {line.note}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-none border border-dashed border-border px-4 py-6 text-sm leading-6 text-base-content/60">
                  This attempt did not save any transcript lines.
                </div>
              )}
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
