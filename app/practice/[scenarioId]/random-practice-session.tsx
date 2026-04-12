"use client";

import { useEffect, useState } from "react";
import { PracticeSession } from "@/components/app/practice-session";
import { scenarios, type Scenario } from "@/data/scenarios";

const RANDOM_SCENARIO_STORAGE_KEY = "practice-random-scenario-id";

function pickRandomScenario(previousScenarioId?: string | null): Scenario {
  const pool = scenarios.filter((scenario) => scenario.id !== previousScenarioId);
  const choices = pool.length > 0 ? pool : scenarios;
  return choices[Math.floor(Math.random() * choices.length)] ?? scenarios[0]!;
}

export function RandomPracticeSession() {
  const [scenario, setScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    try {
      const savedScenarioId =
        window.sessionStorage.getItem(RANDOM_SCENARIO_STORAGE_KEY);
      const savedScenario =
        scenarios.find((item) => item.id === savedScenarioId) ?? null;
      const hasSavedPracticeState = savedScenario
        ? Boolean(window.localStorage.getItem(`practice-state:${savedScenario.id}`))
        : false;
      const nextScenario =
        hasSavedPracticeState && savedScenario
          ? savedScenario
          : pickRandomScenario(savedScenario?.id);

      window.sessionStorage.setItem(
        RANDOM_SCENARIO_STORAGE_KEY,
        nextScenario.id,
      );
      setScenario(nextScenario);
      return;
    } catch {
      // Ignore storage issues and fall back to a fresh random pick.
    }

    setScenario(pickRandomScenario());
  }, []);

  if (!scenario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200 px-6 text-center">
        <div>
          <p>Preparing a random scenario.</p>
          <p className="mt-2 text-sm text-base-content/60">
            We&apos;re picking a prompt without showing the title first.
          </p>
        </div>
      </div>
    );
  }

  return <PracticeSession scenario={scenario} displayTitle="Random scenario" />;
}
