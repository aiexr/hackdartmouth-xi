import { AudioLines, Bot, Database, ShieldCheck } from "lucide-react";
import { envFlags } from "@/lib/env";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const items = [
  {
    title: "NextAuth",
    description: "Google OAuth with MongoDB session storage.",
    ready: envFlags.authReady,
    icon: ShieldCheck,
  },
  {
    title: "Gemini",
    description: "Interviewer turns, scoring, and feedback endpoint wiring.",
    ready: envFlags.geminiReady,
    icon: Bot,
  },
  {
    title: "ElevenLabs",
    description: "Voice synthesis request helper for interviewer playback.",
    ready: envFlags.elevenLabsReady,
    icon: AudioLines,
  },
  {
    title: "MongoDB Atlas",
    description: "Persistent storage entrypoint for attempts and transcripts.",
    ready: envFlags.mongoReady,
    icon: Database,
  },
];

export function StatusGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <item.icon className="size-5" />
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  item.ready
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {item.ready ? "Ready" : "Needs env"}
              </span>
            </div>
            <div>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription className="mt-1">{item.description}</CardDescription>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
