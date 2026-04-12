"use client";

import { useState } from "react";
import { Bell, Clock3, Palette, Volume2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const defaultSettings = [
  {
    icon: Bell,
    title: "Daily reminders",
    description: "Preserve streak momentum with lightweight prompts.",
    enabled: true,
  },
  {
    icon: Volume2,
    title: "Practice audio",
    description: "Play interviewer audio responses during voice sessions.",
    enabled: true,
  },
  {
    icon: Clock3,
    title: "Visible timer",
    description: "Show elapsed time while recording an answer.",
    enabled: true,
  },
  {
    icon: Palette,
    title: "Reduced motion",
    description: "Tone down animation while keeping the same layout language.",
    enabled: false,
  },
];

export function SettingsPanel() {
  const [settings, setSettings] = useState(defaultSettings);

  return (
    <div className="space-y-4">
      {settings.map((setting) => (
        <Card key={setting.title} className="bg-white/80">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex w-11 h-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <setting.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base">{setting.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {setting.description}
                </p>
              </div>
            </div>

            <Switch
              checked={setting.enabled}
              onCheckedChange={(checked) =>
                setSettings((current) =>
                  current.map((item) =>
                    item.title === setting.title ? { ...item, enabled: checked } : item,
                  ),
                )
              }
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
