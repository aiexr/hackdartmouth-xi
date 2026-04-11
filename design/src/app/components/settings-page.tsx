import { Settings, Bell, Volume2, Clock, Palette } from "lucide-react";
import { Switch } from "./ui/switch";

export function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Customize your practice experience.</p>
      </div>

      <div className="space-y-4">
        {[
          { icon: Bell, label: "Daily reminders", desc: "Get notified to keep your streak alive", defaultOn: true },
          { icon: Volume2, label: "Sound effects", desc: "Play sounds for feedback and milestones", defaultOn: true },
          { icon: Clock, label: "Show timer during practice", desc: "Display elapsed time while recording", defaultOn: true },
          { icon: Palette, label: "Reduce animations", desc: "Minimize motion for accessibility", defaultOn: false },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <s.icon className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <h4>{s.label}</h4>
                <p className="text-[0.8125rem] text-muted-foreground">{s.desc}</p>
              </div>
            </div>
            <Switch defaultChecked={s.defaultOn} />
          </div>
        ))}
      </div>
    </div>
  );
}
