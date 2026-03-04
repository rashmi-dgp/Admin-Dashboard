import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Habit } from "../../types";
import { getHabits, addHabit, toggleHabitDay, resetHabit, deleteHabit } from "../../store";
import "./habits.scss";

function Habits() {
  const { data: habits = [], refetch } = useQuery({
    queryKey: ["habits"],
    queryFn: getHabits,
  });

  const [newName, setNewName] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);

  const addMutation = useMutation({
    mutationFn: (name: string) => addHabit(name),
    onSuccess: () => refetch(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ habitId, dayIndex }: { habitId: string; dayIndex: number }) =>
      toggleHabitDay(habitId, dayIndex),
    onSuccess: () => refetch(),
  });

  const resetMutation = useMutation({
    mutationFn: (habitId: string) => resetHabit(habitId),
    onSuccess: () => refetch(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSuccess: () => refetch(),
  });

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMutation.mutate(newName.trim());
    setNewName("");
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
            {!completed && <button className="btnReset" onClick={() => resetMutation.mutate(habit.id)}>Reset</button>}
            <button className="btnDelete" onClick={() => deleteMutation.mutate(habit.id)}>Delete</button>
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
              onClick={() => !completed && i <= currentDay && toggleMutation.mutate({ habitId: habit.id, dayIndex: i })}
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
