import { Sparkles } from "lucide-react";
import { MainShell } from "@/components/app/main-shell";
import { CoachConversation } from "@/components/app/coach-conversation";

export default function CoachPage() {
  return (
    <MainShell>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <div>
          <h1 className="flex items-center gap-3">
            <Sparkles className="size-7 text-primary" />
            AI Coach
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
            This is the coaching surface from the design translated into the app router. It is ready for Gemini-backed feedback flows once real auth and attempt data are connected.
          </p>
        </div>

        <CoachConversation />
      </div>
    </MainShell>
  );
}
