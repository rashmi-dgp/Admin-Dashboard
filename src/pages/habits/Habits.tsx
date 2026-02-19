import { useState, useCallback, useMemo } from "react";
import { Habit } from "../../types";
import { getHabits, addHabit, toggleHabitDay, resetHabit, deleteHabit } from "../../store";
import "./habits.scss";

function Habits() {
  const [habits, setHabits] = useState<Habit[]>(getHabits);
  const [newName, setNewName] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);

  const refresh = useCallback(() => setHabits(getHabits()), []);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addHabit(newName.trim());
    setNewName("");
    refresh();
  };

  const handleToggle = (habitId: string, dayIndex: number) => {
    toggleHabitDay(habitId, dayIndex);
    refresh();
  };

  const handleReset = (habitId: string) => {
    resetHabit(habitId);
    refresh();
  };

  const handleDelete = (habitId: string) => {
    deleteHabit(habitId);
    refresh();
  };

  const getDayNumber = (habit: Habit): number => {
    const start = new Date(habit.startDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(diff, 20);
  };

  const isCompleted = (habit: Habit) => habit.progress.filter(Boolean).length === 21;

  const activeHabits = useMemo(() => habits.filter((h) => !isCompleted(h)), [habits]);
  const completedHabits = useMemo(() => habits.filter(isCompleted), [habits]);

  const renderHabitCard = (habit: Habit, completed: boolean) => {
    const completedDays = habit.progress.filter(Boolean).length;
    const currentDay = getDayNumber(habit);
    const percentage = Math.round((completedDays / 21) * 100);

    return (
      <div key={habit.id} className={`habitCard ${completed ? "completedCard" : ""}`}>
        <div className="habitHeader">
          <div className="habitInfo">
            <h3>
              {completed && <span className="completedBadge">✓ Learned</span>}
              {habit.name}
            </h3>
            <span className="habitMeta">
              Started: {new Date(habit.startDate).toLocaleDateString()} · {completedDays}/21 days
              {completed && ` · Completed`}
            </span>
          </div>
          <div className="habitActions">
            {!completed && <button className="btnReset" onClick={() => handleReset(habit.id)}>Reset</button>}
            <button className="btnDelete" onClick={() => handleDelete(habit.id)}>Delete</button>
          </div>
        </div>

        <div className="progressBar">
          <div className={`progressFill ${completed ? "completedFill" : ""}`} style={{ width: `${percentage}%` }} />
          <span className="progressLabel">{percentage}%</span>
        </div>

        <div className="dayGrid">
          {habit.progress.map((done, i) => (
            <button
              key={i}
              className={`dayCell ${done ? "done" : ""} ${completed ? "done" : i <= currentDay ? "active" : "future"}`}
              onClick={() => !completed && i <= currentDay && handleToggle(habit.id, i)}
              title={`Day ${i + 1}`}
              disabled={completed}
            >
              <span className="dayNum">{i + 1}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="habitsPage">
      <h1 className="pageTitle">Habit Tracker (21-Day Challenge)</h1>

      <div className="addForm">
        <input
          type="text"
          placeholder="New habit name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className="btnPrimary" onClick={handleAdd}>Add Habit</button>
      </div>

      {/* Active Habits */}
      <div className="sectionHeader">
        <h2>Active Habits</h2>
        <span className="sectionCount">{activeHabits.length}</span>
      </div>
      {activeHabits.length === 0 && (
        <p className="empty">No active habits. Start a new 21-day challenge above!</p>
      )}
      <div className="habitList">
        {activeHabits.map((habit) => renderHabitCard(habit, false))}
      </div>

      {/* Previously Learned Habits */}
      {completedHabits.length > 0 && (
        <>
          <div className="sectionHeader completedSection">
            <div className="sectionLeft">
              <h2>Previously Learned</h2>
              <span className="sectionCount completedCount">{completedHabits.length}</span>
            </div>
            <button className="btnToggle" onClick={() => setShowCompleted(!showCompleted)}>
              {showCompleted ? "Hide" : "Show"}
            </button>
          </div>
          {showCompleted && (
            <div className="habitList">
              {completedHabits.map((habit) => renderHabitCard(habit, true))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Habits;
