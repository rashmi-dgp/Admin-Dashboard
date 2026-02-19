import { useState, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getExerciseLogs, toggleExercise, getExerciseStreak, today } from "../../store";
import { ExerciseLog } from "../../types";
import "./exercise.scss";

function Exercise() {
  const [logs, setLogs] = useState<ExerciseLog[]>(getExerciseLogs);

  const refresh = useCallback(() => setLogs(getExerciseLogs()), []);

  const streak = useMemo(() => getExerciseStreak(), [logs]);

  const todayStr = today();
  const todayLog = logs.find((l) => l.date === todayStr);
  const todayDone = todayLog?.done ?? false;

  const handleToggleToday = () => {
    toggleExercise(todayStr);
    refresh();
  };

  const last30 = useMemo(() => {
    const days: { date: string; label: string; done: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const log = logs.find((l) => l.date === dateStr);
      days.push({
        date: dateStr,
        label: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
        done: log?.done ?? false,
      });
    }
    return days;
  }, [logs]);

  const weeklyData = useMemo(() => {
    const weeks: { name: string; count: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      let count = 0;
      for (let d = 6; d >= 0; d--) {
        const date = new Date();
        date.setDate(date.getDate() - w * 7 - d);
        const dateStr = date.toISOString().split("T")[0];
        const log = logs.find((l) => l.date === dateStr);
        if (log?.done) count++;
      }
      const start = new Date();
      start.setDate(start.getDate() - w * 7 - 6);
      weeks.push({
        name: `Week ${4 - w}`,
        count,
      });
    }
    return weeks;
  }, [logs]);

  const totalDone = logs.filter((l) => l.done).length;

  const handleToggleDay = (date: string) => {
    toggleExercise(date);
    refresh();
  };

  return (
    <div className="exercisePage">
      <h1 className="pageTitle">Exercise Tracker</h1>

      {/* Today's Status */}
      <div className="todayCard">
        <div className="todayInfo">
          <h2>Today</h2>
          <span className="todayDate">{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>
        <button className={`todayBtn ${todayDone ? "done" : ""}`} onClick={handleToggleToday}>
          {todayDone ? "✓ Exercise Done!" : "Mark as Done"}
        </button>
      </div>

      {/* Stats Row */}
      <div className="statsRow">
        <div className="statCard">
          <span className="statNum fire">{streak}</span>
          <span className="statLabel">Day Streak</span>
        </div>
        <div className="statCard">
          <span className="statNum">{totalDone}</span>
          <span className="statLabel">Total Sessions</span>
        </div>
        <div className="statCard">
          <span className="statNum">{last30.filter((d) => d.done).length}/30</span>
          <span className="statLabel">Last 30 Days</span>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="chartCard">
        <h3>Weekly Progress (Sessions per Week)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <XAxis dataKey="name" tick={{ fill: "#ccc", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#ccc", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 7]} />
            <Tooltip />
            <Bar dataKey="count" fill="#4caf50" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 30-Day Calendar */}
      <div className="calendarCard">
        <h3>Last 30 Days</h3>
        <div className="calGrid">
          {last30.map((day) => (
            <button
              key={day.date}
              className={`calDay ${day.done ? "done" : ""}`}
              onClick={() => handleToggleDay(day.date)}
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
