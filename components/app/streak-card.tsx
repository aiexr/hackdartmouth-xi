import { Flame, Trophy, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type StreakCardProps = {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  activeDaysCount: number;
};

export function StreakCard({
  currentStreak,
  longestStreak,
  totalSessions,
  activeDaysCount,
}: StreakCardProps) {
  const stats = [
    {
      label: "Current streak",
      value: currentStreak,
      unit: currentStreak === 1 ? "day" : "days",
      icon: Flame,
      color: currentStreak > 0 ? "text-orange-500" : "text-base-content/60",
      bg: currentStreak > 0 ? "bg-orange-50" : "bg-base-200",
    },
    {
      label: "Longest streak",
      value: longestStreak,
      unit: longestStreak === 1 ? "day" : "days",
      icon: Trophy,
      color: longestStreak > 0 ? "text-amber-500" : "text-base-content/60",
      bg: longestStreak > 0 ? "bg-amber-50" : "bg-base-200",
    },
    {
      label: "Active days",
      value: activeDaysCount,
      unit: "total",
      icon: Calendar,
      color: activeDaysCount > 0 ? "text-emerald-500" : "text-base-content/60",
      bg: activeDaysCount > 0 ? "bg-emerald-50" : "bg-base-200",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center gap-2 rounded-none border border-base-300 bg-base-100 p-4"
        >
          <div className={cn("flex size-10 items-center justify-center rounded-none", stat.bg)}>
            <stat.icon className={cn("size-5", stat.color)} />
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">{stat.value}</div>
            <div className="text-xs text-base-content/60">{stat.unit}</div>
          </div>
          <div className="text-xs font-medium text-base-content/60">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
