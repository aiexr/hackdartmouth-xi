import { PracticeSession } from "@/components/app/practice-session";
import { getScenarioById } from "@/data/scenarios";
import { RandomPracticeSession } from "./random-practice-session";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;

  if (scenarioId === "random") {
    return <RandomPracticeSession />;
  }

  const scenario = getScenarioById(scenarioId);

  return <PracticeSession scenario={scenario} />;
}
