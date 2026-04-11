"use client";

import { useState } from "react";
import { FileText, Linkedin, Briefcase, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  resumeText: string;
  linkedinText: string;
  jobDescriptionText: string;
};

const sections = [
  {
    key: "resumeText" as const,
    label: "Resume",
    icon: FileText,
    placeholder:
      "Paste your resume text here. This helps the AI grade your answers against your actual experience.",
    description: "Your background, skills, and experience.",
  },
  {
    key: "linkedinText" as const,
    label: "LinkedIn",
    icon: Linkedin,
    placeholder:
      "Paste your LinkedIn About section and recent experience entries here.",
    description: "Your professional positioning and career narrative.",
  },
  {
    key: "jobDescriptionText" as const,
    label: "Target Job",
    icon: Briefcase,
    placeholder:
      "Paste the job description you're preparing for. The AI will evaluate role fit and highlight gaps.",
    description: "The specific role you're interviewing for.",
  },
] as const;

type SaveState = "idle" | "saving" | "saved" | "error";

export function ProfileContextEditor(props: Props) {
  const [values, setValues] = useState({
    resumeText: props.resumeText,
    linkedinText: props.linkedinText,
    jobDescriptionText: props.jobDescriptionText,
  });
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({
    resumeText: "idle",
    linkedinText: "idle",
    jobDescriptionText: "idle",
  });

  async function save(key: keyof typeof values) {
    setSaveStates((prev) => ({ ...prev, [key]: "saving" }));
    try {
      const res = await fetch("/api/profile/context", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: values[key] }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStates((prev) => ({ ...prev, [key]: "saved" }));
      setTimeout(() => {
        setSaveStates((prev) =>
          prev[key] === "saved" ? { ...prev, [key]: "idle" } : prev,
        );
      }, 2000);
    } catch {
      setSaveStates((prev) => ({ ...prev, [key]: "error" }));
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2>Your Context</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your background so the AI can personalize interview feedback.
          Leave any section empty to use the default rubric.
        </p>

        <div className="mt-6 space-y-6">
          {sections.map((section) => {
            const state = saveStates[section.key];
            return (
              <div key={section.key}>
                <div className="mb-2 flex items-center gap-2">
                  <section.icon className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{section.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {section.description}
                  </span>
                </div>

                <Textarea
                  value={values[section.key]}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [section.key]: e.target.value,
                    }))
                  }
                  placeholder={section.placeholder}
                  className="min-h-24"
                  rows={4}
                />

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {values[section.key].length.toLocaleString()} characters
                  </span>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => save(section.key)}
                    disabled={state === "saving"}
                  >
                    {state === "saving" && (
                      <Loader2 className="size-3.5 animate-spin" />
                    )}
                    {state === "saved" && (
                      <Check className="size-3.5 text-emerald-600" />
                    )}
                    {state === "saved" ? "Saved" : "Save"}
                  </Button>
                </div>

                {state === "error" && (
                  <p className="mt-1 text-xs text-red-600">
                    Failed to save. Please try again.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
