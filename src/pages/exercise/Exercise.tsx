import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getExerciseLogs, toggleExercise, computeMonthStreak, today } from "../../store";
import "./exercise.scss";

const APP_START_MONTH = "2026-01"; // earliest month to show in the dropdown

// First Monday of February 2026 — the earliest week we allow navigating to
const CHART_START_MONDAY = new Date(2026, 1, 2); // Feb 2, 2026

function formatMonthValue(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function getAvailableMonths(): { value: string; label: string }[] {
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  const [startYear, startMonth] = APP_START_MONTH.split("-").map(Number);
  // startMonth from "2026-01" is 1-indexed, convert to 0-indexed
  const earliestYear = startYear;
  const earliestMonth = startMonth - 1;

  while (year > earliestYear || (year === earliestYear && month >= earliestMonth)) {
    const value = formatMonthValue(year, month);
    const label = new Date(year, month, 1).toLocaleDateString("en", {
      month: "long",
      year: "numeric",
    });
    months.push({ value, label });
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
  }
  return months;
}

function Exercise() {
  const { data: logs = [], refetch } = useQuery({
    queryKey: ["exerciseLogs"],
    queryFn: getExerciseLogs,
  });

  const toggleMutation = useMutation({
    mutationFn: (date: string) => toggleExercise(date),
    onSuccess: () => refetch(),
  });

  const todayStr = today();
  const currentMonth = todayStr.slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  // weekOffset 0 = most recent 4 weeks, -1 = previous 4 weeks, etc.
  const [weekOffset, setWeekOffset] = useState(0);

  const todayLog = logs.find((l) => l.date === todayStr);
  const todayDone = todayLog?.done ?? false;

  const availableMonths = useMemo(() => getAvailableMonths(), []);

  const monthStreak = useMemo(
    () => computeMonthStreak(logs, selectedMonth),
    [logs, selectedMonth]
  );

  const monthDays = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: { date: string; label: string; done: boolean; isFuture: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, "0")}`;
      const log = logs.find((l) => l.date === dateStr);
      days.push({
        date: dateStr,
        label: new Date(dateStr + "T00:00:00").toLocaleDateString("en", {
          month: "short",
          day: "numeric",
        }),
        done: log?.done ?? false,
        isFuture: dateStr > todayStr,
      });
    }
    return days;
  }, [logs, selectedMonth, todayStr]);

  const monthDone = monthDays.filter((d) => d.done).length;
  const monthTotal = monthDays.filter((d) => !d.isFuture).length;

  const totalDone = logs.filter((l) => l.done).length;

  const { weeklyData, canGoBack, canGoForward } = useMemo(() => {
    const doneSet = new Set(logs.filter((l) => l.done).map((l) => l.date));

    // Most recent Monday (or today if today is Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - daysToMonday);
    thisMonday.setHours(0, 0, 0, 0);

    // The last (most recent) Monday of the currently displayed 4-week window
    const windowEndMonday = new Date(thisMonday);
    windowEndMonday.setDate(thisMonday.getDate() + weekOffset * 4 * 7);

    const fmt = (d: Date) =>
      d.toLocaleDateString("en", { month: "short", day: "numeric" });

    const weeks: { name: string; count: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(windowEndMonday);
      weekStart.setDate(windowEndMonday.getDate() - w * 7);

      let count = 0;
      for (let d = 0; d < 7; d++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + d);
        const yyyy = day.getFullYear();
        const mm = String(day.getMonth() + 1).padStart(2, "0");
        const dd = String(day.getDate()).padStart(2, "0");
        if (doneSet.has(`${yyyy}-${mm}-${dd}`)) count++;
      }

      const endDay = new Date(weekStart);
      endDay.setDate(weekStart.getDate() + 6);
      weeks.push({ name: `${fmt(weekStart)} – ${fmt(endDay)}`, count });
    }

    // How many 4-week steps back from thisMonday until the window START reaches CHART_START_MONDAY
    const msPerWindow = 28 * 24 * 60 * 60 * 1000;
    const msDiff = thisMonday.getTime() - CHART_START_MONDAY.getTime();
    // minimum offset (most negative) allowed — e.g. -2 means 2 steps back
    const minOffset = -Math.floor(msDiff / msPerWindow);

    return {
      weeklyData: weeks,
      canGoBack: weekOffset > minOffset,
      canGoForward: weekOffset < 0,
    };
  }, [logs, weekOffset]);

  const selectedMonthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en", {
      month: "long",
      year: "numeric",
    });
  }, [selectedMonth]);

  return (
    <div className="exercisePage">
      <h1 className="pageTitle">Exercise Tracker</h1>

      {/* Today's Status */}
      <div className="todayCard">
        <div className="todayInfo">
          <h2>Today</h2>
          <span className="todayDate">
            {new Date().toLocaleDateString("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <button
          className={`todayBtn ${todayDone ? "done" : ""}`}
          onClick={() => toggleMutation.mutate(todayStr)}
        >
          {todayDone ? "✓ Exercise Done!" : "Mark as Done"}
        </button>
      </div>

      {/* Stats Row */}
      <div className="statsRow">
        <div className="statCard">
          <span className="statNum fire">{monthStreak}</span>
          <span className="statLabel">Best Streak ({selectedMonthLabel.split(" ")[0]})</span>
        </div>
        <div className="statCard">
          <span className="statNum">{totalDone}</span>
          <span className="statLabel">Total Sessions</span>
        </div>
        <div className="statCard">
          <span className="statNum">
            {monthDone}/{monthTotal}
          </span>
          <span className="statLabel">{selectedMonthLabel.split(" ")[0]} Sessions</span>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="chartCard">
        <div className="chartHeader">
          <h3>Weekly Progress (Sessions per Week)</h3>
          <div className="weekNav">
            <button
              className="weekNavBtn"
              onClick={() => setWeekOffset((o) => o - 1)}
              disabled={!canGoBack}
              title="Previous 4 weeks"
            >
              ‹
            </button>
            <button
              className="weekNavBtn"
              onClick={() => setWeekOffset((o) => o + 1)}
              disabled={!canGoForward}
              title="Next 4 weeks"
            >
              ›
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <XAxis
              dataKey="name"
              tick={{ fill: "#ccc", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#ccc", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 7]}
            />
            <Tooltip />
            <Bar dataKey="count" fill="#4caf50" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Month Calendar */}
      <div className="calendarCard">
        <div className="calendarHeader">
          <h3>{selectedMonthLabel}</h3>
          <select
            className="monthSelect"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="calGrid">
          {monthDays.map((day) => (
            <button
              key={day.date}
              className={`calDay ${day.done ? "done" : ""} ${day.isFuture ? "future" : ""}`}
              onClick={() => !day.isFuture && toggleMutation.mutate(day.date)}
              disabled={day.isFuture}
              title={day.date}
            >
              <span className="calLabel">{day.label}</span>
              {day.done && <span className="calCheck">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Exercise;
