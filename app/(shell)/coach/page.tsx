import { Sparkles } from "lucide-react";
import { CoachConversation } from "@/components/app/coach-conversation";

export default function CoachPage() {
  return (
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <div>
          <h1 className="flex items-center gap-3">
            <Sparkles className="size-7 text-primary" />
            AI Coach
          </h1>
          <p className="mt-3 max-w-3xl text-base text-base-content/60">
            Get personalized resume feedback and interview coaching powered by AI.
          </p>
        </div>

        <CoachConversation />
      </div>
  );
}
