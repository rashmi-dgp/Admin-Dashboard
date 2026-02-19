import { DailyTask, Habit, Expense, ExerciseLog, OfficeTask } from "./types";

const KEYS = {
  TASKS: "tracker_daily_tasks",
  HABITS: "tracker_habits",
  EXPENSES: "tracker_expenses",
  EXERCISE: "tracker_exercise",
  OFFICE: "tracker_office_tasks",
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

// --- Daily Tasks ---

export function getTasks(): DailyTask[] {
  return load<DailyTask[]>(KEYS.TASKS, []);
}

export function saveTasks(tasks: DailyTask[]): void {
  save(KEYS.TASKS, tasks);
}

export function addTask(task: Omit<DailyTask, "id" | "createdAt">): DailyTask {
  const tasks = getTasks();
  const newTask: DailyTask = { ...task, id: generateId(), createdAt: new Date().toISOString() };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTask(id: string, updates: Partial<DailyTask>): void {
  const tasks = getTasks().map((t) => (t.id === id ? { ...t, ...updates } : t));
  saveTasks(tasks);
}

export function deleteTask(id: string): void {
  saveTasks(getTasks().filter((t) => t.id !== id));
}

// --- Habits ---

export function getHabits(): Habit[] {
  const habits = load<Habit[]>(KEYS.HABITS, []);
  if (habits.length === 0) {
    const seeded = seedDummyHabits();
    saveHabits(seeded);
    return seeded;
  }
  return habits;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function seedDummyHabits(): Habit[] {
  return [
    {
      id: "seed_1",
      name: "Morning Meditation",
      startDate: daysAgo(45),
      progress: new Array(21).fill(true),
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
      id: "seed_2",
      name: "Read 30 Minutes Daily",
      startDate: daysAgo(60),
      progress: new Array(21).fill(true),
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: "seed_3",
      name: "Drink 8 Glasses of Water",
      startDate: daysAgo(30),
      progress: new Array(21).fill(true),
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: "seed_4",
      name: "No Social Media Before Noon",
      startDate: daysAgo(25),
      progress: [...new Array(18).fill(true), false, true, true],
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
  ];
}

export function saveHabits(habits: Habit[]): void {
  save(KEYS.HABITS, habits);
}

export function addHabit(name: string): Habit {
  const habits = getHabits();
  const habit: Habit = {
    id: generateId(),
    name,
    startDate: today(),
    progress: new Array(21).fill(false),
    createdAt: new Date().toISOString(),
  };
  habits.push(habit);
  saveHabits(habits);
  return habit;
}

export function toggleHabitDay(habitId: string, dayIndex: number): void {
  const habits = getHabits().map((h) => {
    if (h.id === habitId) {
      const progress = [...h.progress];
      progress[dayIndex] = !progress[dayIndex];
      return { ...h, progress };
    }
    return h;
  });
  saveHabits(habits);
}

export function resetHabit(habitId: string): void {
  const habits = getHabits().map((h) =>
    h.id === habitId ? { ...h, startDate: today(), progress: new Array(21).fill(false) } : h
  );
  saveHabits(habits);
}

export function deleteHabit(id: string): void {
  saveHabits(getHabits().filter((h) => h.id !== id));
}

// --- Expenses ---

export function getExpenses(): Expense[] {
  const expenses = load<Expense[]>(KEYS.EXPENSES, []);
  if (expenses.length === 0) {
    const seeded = seedDummyExpenses();
    saveExpenses(seeded);
    return seeded;
  }
  return expenses;
}

function seedDummyExpenses(): Expense[] {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lmYear = lastMonth.getFullYear();
  const lmMonth = String(lastMonth.getMonth() + 1).padStart(2, "0");

  return [
    {
      id: "seed_exp_1",
      title: "Monthly Rent",
      amount: 18000,
      category: "bills",
      date: `${lmYear}-${lmMonth}-01`,
      createdAt: new Date(lmYear, lastMonth.getMonth(), 1).toISOString(),
    },
    {
      id: "seed_exp_2",
      title: "Grocery Shopping",
      amount: 3000,
      category: "food",
      date: `${lmYear}-${lmMonth}-10`,
      createdAt: new Date(lmYear, lastMonth.getMonth(), 10).toISOString(),
    },
  ];
}

export function saveExpenses(expenses: Expense[]): void {
  save(KEYS.EXPENSES, expenses);
}

export function addExpense(expense: Omit<Expense, "id" | "createdAt">): Expense {
  const expenses = getExpenses();
  const newExpense: Expense = { ...expense, id: generateId(), createdAt: new Date().toISOString() };
  expenses.push(newExpense);
  saveExpenses(expenses);
  return newExpense;
}

export function updateExpense(id: string, updates: Partial<Expense>): void {
  const expenses = getExpenses().map((e) => (e.id === id ? { ...e, ...updates } : e));
  saveExpenses(expenses);
}

export function deleteExpense(id: string): void {
  saveExpenses(getExpenses().filter((e) => e.id !== id));
}

// --- Exercise ---

export function getExerciseLogs(): ExerciseLog[] {
  return load<ExerciseLog[]>(KEYS.EXERCISE, []);
}

export function saveExerciseLogs(logs: ExerciseLog[]): void {
  save(KEYS.EXERCISE, logs);
}

export function toggleExercise(date: string): void {
  const logs = getExerciseLogs();
  const existing = logs.find((l) => l.date === date);
  if (existing) {
    existing.done = !existing.done;
  } else {
    logs.push({ date, done: true });
  }
  saveExerciseLogs(logs);
}

export function getExerciseStreak(): number {
  const logs = getExerciseLogs();
  const doneSet = new Set(logs.filter((l) => l.done).map((l) => l.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const dateStr = d.toISOString().split("T")[0];
    if (doneSet.has(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// --- Office Tasks ---

export function getOfficeTasks(): OfficeTask[] {
  return load<OfficeTask[]>(KEYS.OFFICE, []);
}

export function saveOfficeTasks(tasks: OfficeTask[]): void {
  save(KEYS.OFFICE, tasks);
}

export function addOfficeTask(task: Omit<OfficeTask, "id" | "createdAt">): OfficeTask {
  const tasks = getOfficeTasks();
  const newTask: OfficeTask = { ...task, id: generateId(), createdAt: new Date().toISOString() };
  tasks.push(newTask);
  saveOfficeTasks(tasks);
  return newTask;
}

export function updateOfficeTask(id: string, updates: Partial<OfficeTask>): void {
  const tasks = getOfficeTasks().map((t) => (t.id === id ? { ...t, ...updates } : t));
  saveOfficeTasks(tasks);
}

export function deleteOfficeTask(id: string): void {
  saveOfficeTasks(getOfficeTasks().filter((t) => t.id !== id));
}
