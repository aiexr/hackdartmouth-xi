import { Settings } from "lucide-react";
import { MainShell } from "@/components/app/main-shell";
import { SettingsPanel } from "@/components/app/settings-panel";

export default function SettingsPage() {
  return (
    <MainShell>
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <div>
          <h1 className="flex items-center gap-3">
            <Settings className="size-7 text-primary" />
            Settings
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Light mode only, clean defaults, and a minimal set of controls that match the generated design language.
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Practice Preferences</h2>
          <SettingsPanel />
        </div>
      </div>
    </MainShell>
  );
}
