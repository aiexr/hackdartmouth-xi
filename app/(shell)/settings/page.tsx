import { Settings } from "lucide-react";
import { SettingsPanel } from "@/components/app/settings-panel";

export default function SettingsPage() {
  return (
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <div>
          <h1 className="flex items-center gap-3">
            <Settings className="size-7 text-primary" />
            Settings
          </h1>
          <p className="mt-3 max-w-2xl text-base text-base-content/60">
            Appearance and account controls.
          </p>
        </div>

        <SettingsPanel />
      </div>
  );
}
