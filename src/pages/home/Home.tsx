import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { getTasks } from "../../store";
import { getHabits, getExpenses, getExerciseLogs, getExerciseStreak, getOfficeTasks } from "../../store";
import { CATEGORY_COLORS } from "../../data";
import "./home.scss";

function Home() {
  const tasks = useMemo(() => getTasks(), []);
  const habits = useMemo(() => getHabits(), []);
  const expenses = useMemo(() => getExpenses(), []);
  const exerciseLogs = useMemo(() => getExerciseLogs(), []);
  const officeTasks = useMemo(() => getOfficeTasks(), []);
  const streak = useMemo(() => getExerciseStreak(), []);

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;

  const habitProgress = habits.length
    ? Math.round(habits.reduce((sum, h) => sum + h.progress.filter(Boolean).length, 0) / (habits.length * 21) * 100)
    : 0;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const exerciseDoneCount = exerciseLogs.filter((l) => l.done).length;

  const weeklyExercise = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const log = exerciseLogs.find((l) => l.date === dateStr);
      days.push({
        name: d.toLocaleDateString("en", { weekday: "short" }),
        done: log?.done ? 1 : 0,
      });
    }
    return days;
  }, [exerciseLogs]);

  const officeCompleted = officeTasks.filter((t) => t.status === "completed").length;
  const officeHigh = officeTasks.filter((t) => t.priority === "high" && t.status !== "completed").length;

  const taskPieData = [
    { name: "Completed", value: completedTasks || 0 },
    { name: "Pending", value: pendingTasks || 0 },
  ];

  return (
    <div className="home">
      <h1 className="pageTitle">Dashboard</h1>
      <div className="dashGrid">
        {/* Task Summary */}
        <Link to="/tasks" className="card taskCard">
          <div className="cardHeader">
            <h3>Daily Tasks</h3>
            <span className="badge">{tasks.length}</span>
          </div>
          <div className="cardBody">
            {tasks.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={taskPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                    <Cell fill="#4caf50" />
                    <Cell fill="#ff9800" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="emptyHint">No tasks yet</p>
            )}
            <div className="statRow">
              <span className="statGreen">{completedTasks} done</span>
              <span className="statOrange">{pendingTasks} pending</span>
            </div>
          </div>
        </Link>

        {/* Habit Progress */}
        <Link to="/habits" className="card habitCard">
          <div className="cardHeader">
            <h3>Habits (21-Day)</h3>
            <span className="badge">{habits.length}</span>
          </div>
          <div className="cardBody">
            <div className="progressRing">
              <svg viewBox="0 0 36 36">
                <path
                  className="ringBg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="ringFill"
                  strokeDasharray={`${habitProgress}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="ringText">
                  {habitProgress}%
                </text>
              </svg>
            </div>
            <p className="cardHint">{habits.length} active habit{habits.length !== 1 ? "s" : ""}</p>
          </div>
        </Link>

        {/* Expense Summary */}
        <Link to="/expenses" className="card expenseCard">
          <div className="cardHeader">
            <h3>Expenses</h3>
            <span className="badge">₹{totalExpenses.toLocaleString("en-IN")}</span>
          </div>
          <div className="cardBody">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={50} dataKey="value" label={({ name }) => name}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#8884d8"} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="emptyHint">No expenses recorded</p>
            )}
          </div>
        </Link>

        {/* Exercise Status */}
        <Link to="/exercise" className="card exerciseCard">
          <div className="cardHeader">
            <h3>Exercise</h3>
            <span className="badge streakBadge">🔥 {streak} day streak</span>
          </div>
          <div className="cardBody">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyExercise}>
                <XAxis dataKey="name" tick={{ fill: "#ccc", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="done" fill="#4caf50" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="cardHint">{exerciseDoneCount} sessions logged</p>
          </div>
        </Link>

        {/* Office Tasks */}
        <Link to="/office" className="card officeCard">
          <div className="cardHeader">
            <h3>Office Tasks</h3>
            <span className="badge">{officeTasks.length}</span>
          </div>
          <div className="cardBody">
            <div className="officeStats">
              <div className="officeStat">
                <span className="officeNum">{officeCompleted}</span>
                <span className="officeLabel">Completed</span>
              </div>
              <div className="officeStat">
                <span className="officeNum">{officeTasks.length - officeCompleted}</span>
                <span className="officeLabel">Remaining</span>
              </div>
              <div className="officeStat">
                <span className="officeNum officeHigh">{officeHigh}</span>
                <span className="officeLabel">High Priority</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Home;
