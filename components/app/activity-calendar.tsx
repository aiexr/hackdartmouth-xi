import type { ActivityDay } from "@/lib/interview-metrics";

function getIntensity(count: number) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

const fillClasses = [
  "cal-fill-0",
  "cal-fill-1",
  "cal-fill-2",
  "cal-fill-3",
  "cal-fill-4",
];

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;
const DAY_LABEL_WIDTH = 25;

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
  const gridWidth = weeks.length > 0 ? weeks.length * CELL + (weeks.length - 1) * GAP : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-base-content">
          {totalSessions} interview session{totalSessions !== 1 ? "s" : ""} in the last year
        </p>
      </div>

      <div className="overflow-x-auto rounded-none border border-border px-3 py-2">
        <div className="min-w-max">
          {/* Month labels */}
          <div className="relative" style={{ marginLeft: DAY_LABEL_WIDTH, width: gridWidth, height: 16 }}>
            {months.map((m, i) => {
              const nextX = months[i + 1]?.x ?? weeks.length;
              const span = nextX - m.x;

              if (span < 3) {
                return null;
              }

              return (
                <span
                  key={`${m.label}-${m.x}`}
                  className="absolute top-0 text-xs text-base-content/60"
                  style={{ left: m.x * STEP }}
                >
                  {m.label}
                </span>
              );
            })}
          </div>

          {/* Grid with day labels */}
          <div className="mt-1 flex">
            {/* Day-of-week labels */}
            <div className="flex flex-col pr-1" style={{ gap: GAP, width: DAY_LABEL_WIDTH, flexShrink: 0 }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => (
                <div
                  key={label}
                  className="flex items-center text-[9px] text-base-content/60"
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

                    const label = day.count === 0
                      ? `No interviews on ${day.date}`
                      : `${day.count} interview${day.count !== 1 ? "s" : ""} on ${day.date}`;

                    return (
                      <div
                        key={day.date}
                        className={`group relative ${fillClasses[intensity]}`}
                        style={{
                          width: CELL,
                          height: CELL,
                        }}
                      >
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-none bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg group-hover:block">
                          {label}
                          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-base-content/60">
            <span>Less</span>
            {fillClasses.map((cls, i) => (
              <div
                key={i}
                className={cls}
                style={{
                  width: CELL,
                  height: CELL,
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
