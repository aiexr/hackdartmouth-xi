import { Settings } from "lucide-react";
import { MainShell } from "@/components/app/main-shell";
import { SettingsPanel } from "@/components/app/settings-panel";
import { ProfileEditor } from "@/components/app/profile-editor";

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

        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
            <ProfileEditor />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Practice Preferences</h2>
            <SettingsPanel />
          </div>
        </div>
      </div>
    </MainShell>
  );
}
