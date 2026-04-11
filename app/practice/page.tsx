import { redirect } from "next/navigation";
import { scenarios } from "@/data/scenarios";

export default function PracticeIndexPage() {
  const defaultScenarioId = scenarios[0]?.id;

  if (!defaultScenarioId) {
    redirect("/");
  }

  redirect(`/practice/${defaultScenarioId}`);
}
