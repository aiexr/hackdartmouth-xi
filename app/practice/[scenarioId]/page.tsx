import { PracticeSession } from "@/components/app/practice-session";
import { getScenarioById } from "@/data/scenarios";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const scenario = getScenarioById(scenarioId);

  return <PracticeSession scenario={scenario} />;
}
