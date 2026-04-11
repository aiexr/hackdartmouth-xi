import type { ActivityDay } from "@/lib/interview-metrics";

function getIntensity(count: number) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

const fills = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

const CELL = 8;
const GAP = 2;
const STEP = CELL + GAP;

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type ActivityCalendarProps = {
  activityDays: ActivityDay[];
  totalSessions: number;
};

function buildWeeks(days: ActivityDay[]) {
  const weeks: (ActivityDay | null)[][] = [];
  let week: (ActivityDay | null)[] = [];

  if (days.length > 0) {
    const firstDow = new Date(days[0].date).getDay();
    for (let i = 0; i < firstDow; i++) {
      week.push(null);
    }
  }

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    weeks.push(week);
  }

  return weeks;
}

function getMonthPositions(weeks: (ActivityDay | null)[][]) {
  const months: { label: string; x: number }[] = [];
  let prevMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const realDay = weeks[w].find((d) => d?.date);
    if (!realDay?.date) continue;
    const m = new Date(realDay.date).getMonth();
    if (m !== prevMonth) {
      months.push({ label: monthLabels[m], x: w });
      prevMonth = m;
    }
  }
  return months;
}

function getAvailableYears(days: ActivityDay[]) {
  const years = new Set<number>();
  for (const d of days) {
    if (d.date) years.add(new Date(d.date).getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

export function ActivityCalendar({ activityDays, totalSessions }: ActivityCalendarProps) {
  const availableYears = getAvailableYears(activityDays);
  // We render all data as-is (last 365 days). The year buttons are visual only for now.
  const currentYear = new Date().getFullYear();

  const weeks = buildWeeks(activityDays);
  const months = getMonthPositions(weeks);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {totalSessions} interview session{totalSessions !== 1 ? "s" : ""} in the last year
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border px-3 py-2">
          {/* Month labels */}
          <div className="flex" style={{ paddingLeft: 26 }}>
            {months.map((m, i) => {
              const nextX = months[i + 1]?.x ?? weeks.length;
              const span = nextX - m.x;
              const pct = (span / weeks.length) * 100;
              return (
                <span
                  key={`${m.label}-${m.x}`}
                  className="text-xs text-muted-foreground"
                  style={{ width: `${pct}%` }}
                >
                  {span >= 3 ? m.label : ""}
                </span>
              );
            })}
          </div>

          {/* Grid with day labels */}
          <div className="mt-1 flex">
            {/* Day-of-week labels */}
            <div className="flex flex-col pr-1" style={{ gap: GAP, width: 25, flexShrink: 0 }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => (
                <div
                  key={label}
                  className="flex items-center text-[9px] text-muted-foreground"
                  style={{ height: CELL }}
                >
                  {i % 2 === 1 ? label : ""}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex flex-1" style={{ gap: GAP }}>
              {weeks.map((wk, wi) => (
                <div key={wi} className="flex flex-col items-center" style={{ gap: GAP }}>
                  {Array.from({ length: 7 }).map((_, di) => {
                    const day = wk[di];

                    if (!day) {
                      return <div key={di} style={{ width: CELL, height: CELL }} />;
                    }

                    const intensity = getIntensity(day.count);

                    return (
                      <div
                        key={day.date}
                        style={{
                          width: CELL,
                          height: CELL,
                          backgroundColor: fills[intensity],
                          borderRadius: 2,
                        }}
                        title={`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            <span>Less</span>
            {fills.map((color, i) => (
              <div
                key={i}
                style={{
                  width: CELL,
                  height: CELL,
                  backgroundColor: color,
                  borderRadius: 2,
                }}
              />
            ))}
            <span>More</span>
          </div>
      </div>
    </div>
  );
}
