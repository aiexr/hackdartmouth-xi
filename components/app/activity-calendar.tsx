"use client";

import { useMemo, useState } from "react";
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
};

type CalendarView =
  | { kind: "rolling" }
  | { kind: "year"; year: number };

type CalendarCell =
  | { kind: "day"; date: string; count: number }
  | { kind: "pad"; key: string };

function toDayKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildWeeks(days: CalendarCell[]) {
  const weeks: CalendarCell[][] = [];
  let week: CalendarCell[] = [];

  if (days.length > 0 && days[0]?.kind === "day") {
    const firstDow = new Date(days[0].date).getDay();
    for (let i = 0; i < firstDow; i += 1) {
      week.push({ kind: "pad", key: `lead-${i}` });
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
    while (week.length < 7) {
      week.push({ kind: "pad", key: `trail-${weeks.length}-${week.length}` });
    }
    weeks.push(week);
  }

  return weeks;
}

function getMonthPositions(weeks: CalendarCell[][]) {
  const months: { label: string; x: number }[] = [];
  let prevMonth = -1;

  for (let w = 0; w < weeks.length; w += 1) {
    const realDay = weeks[w]?.find((d) => d.kind === "day");
    if (!realDay || realDay.kind !== "day") continue;

    const month = new Date(realDay.date).getMonth();
    if (month !== prevMonth) {
      months.push({ label: monthLabels[month]!, x: w });
      prevMonth = month;
    }
  }

  return months;
}

function getAvailableYears(days: ActivityDay[]) {
  const years = new Set<number>();
  for (const day of days) {
    years.add(Number(day.date.slice(0, 4)));
  }
  return [...years].sort((a, b) => b - a);
}

function buildRangeDays(activityDays: ActivityDay[], start: Date, end: Date) {
  const countsByDate = new Map<string, number>();

  for (const day of activityDays) {
    const normalized = day.date.slice(0, 10);
    countsByDate.set(normalized, day.count);
  }

  const cursor = new Date(start);
  const days: CalendarCell[] = [];

  while (cursor <= end) {
    const iso = toDayKey(cursor);
    days.push({
      kind: "day",
      date: iso,
      count: countsByDate.get(iso) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function buildRollingYearDays(activityDays: ActivityDay[]) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setDate(start.getDate() - 364);

  return buildRangeDays(activityDays, start, end);
}

function buildYearDays(activityDays: ActivityDay[], year: number) {
  return buildRangeDays(activityDays, new Date(year, 0, 1), new Date(year, 11, 31));
}

export function ActivityCalendar({ activityDays }: ActivityCalendarProps) {
  const availableYears = useMemo(() => getAvailableYears(activityDays), [activityDays]);
  const [selectedView, setSelectedView] = useState<CalendarView>({ kind: "rolling" });

  const visibleDays = useMemo(
    () =>
      selectedView.kind === "year"
        ? buildYearDays(activityDays, selectedView.year)
        : buildRollingYearDays(activityDays),
    [activityDays, selectedView],
  );
  const weeks = useMemo(() => buildWeeks(visibleDays), [visibleDays]);
  const months = useMemo(() => getMonthPositions(weeks), [weeks]);
  const visibleSessions = useMemo(
    () =>
      visibleDays.reduce((sum, day) => (
        day.kind === "day" ? sum + day.count : sum
      ), 0),
    [visibleDays],
  );
  const gridWidth = weeks.length > 0 ? weeks.length * CELL + (weeks.length - 1) * GAP : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-base-content">
          {selectedView.kind === "year"
            ? `${visibleSessions} interview session${visibleSessions !== 1 ? "s" : ""} in ${selectedView.year}`
            : `${visibleSessions} interview session${visibleSessions !== 1 ? "s" : ""} in the last 12 months`}
        </p>
        {availableYears.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-base-content/60">
            <span>View</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedView({ kind: "rolling" })}
                className={
                  selectedView.kind === "rolling"
                    ? "rounded-none border border-primary/60 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                    : "rounded-none border border-base-300 px-2 py-0.5 text-[11px] font-medium text-base-content/60 transition hover:border-base-content/30 hover:text-base-content"
                }
              >
                Last 12 mo
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedView({ kind: "year", year })}
                  className={
                    selectedView.kind === "year" && year === selectedView.year
                      ? "rounded-none border border-primary/60 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                      : "rounded-none border border-base-300 px-2 py-0.5 text-[11px] font-medium text-base-content/60 transition hover:border-base-content/30 hover:text-base-content"
                  }
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-visible rounded-none border border-border px-3 py-2">
        <div className="min-w-max">
          <div
            className="relative"
            style={{ marginLeft: DAY_LABEL_WIDTH, width: gridWidth, height: 40 }}
          >
            {months.map((month, i) => {
              const nextX = months[i + 1]?.x ?? weeks.length;
              const span = nextX - month.x;

              if (span < 2) {
                return null;
              }

              return (
                <span
                  key={`${month.label}-${month.x}`}
                  className="absolute bottom-0 text-xs text-base-content/60"
                  style={{ left: month.x * STEP }}
                >
                  {month.label}
                </span>
              );
            })}
          </div>

          <div className="mt-1 flex">
            <div
              className="flex flex-col pr-1"
              style={{ gap: GAP, width: DAY_LABEL_WIDTH, flexShrink: 0 }}
            >
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

            <div className="flex flex-1" style={{ gap: GAP }}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col items-center" style={{ gap: GAP }}>
                  {week.map((day, dayIndex) => {
                    if (day.kind === "pad") {
                      return (
                        <div
                          key={day.key ?? `${weekIndex}-${dayIndex}`}
                          className={fillClasses[0]}
                          style={{ width: CELL, height: CELL }}
                        />
                      );
                    }

                    const intensity = getIntensity(day.count);
                    const label = day.count === 0
                      ? `No interviews on ${day.date}`
                      : `${day.count} interview${day.count !== 1 ? "s" : ""} on ${day.date}`;

                    return (
                      <div
                        key={day.date}
                        className={`group relative ${fillClasses[intensity]}`}
                        style={{ width: CELL, height: CELL }}
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

          <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-base-content/60">
            <span>Less</span>
            {fillClasses.map((fillClass, i) => (
              <div
                key={i}
                className={fillClass}
                style={{ width: CELL, height: CELL }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
