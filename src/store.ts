import { DailyTask, Habit, Expense, ExerciseLog, OfficeTask } from "./types";
import { supabase } from "./lib/supabase";

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

// --------------- row mappers (snake_case DB → camelCase TS) ---------------

function mapTask(row: Record<string, unknown>): DailyTask {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    status: row.status as DailyTask["status"],
    date: row.date as string,
    createdAt: row.created_at as string,
  };
}

function mapHabit(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    name: row.name as string,
    startDate: row.start_date as string,
    progress: row.progress as boolean[],
    createdAt: row.created_at as string,
  };
}

function mapExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    title: row.title as string,
    amount: Number(row.amount),
    category: row.category as Expense["category"],
    date: row.date as string,
    createdAt: row.created_at as string,
  };
}

function mapOfficeTask(row: Record<string, unknown>): OfficeTask {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    priority: row.priority as OfficeTask["priority"],
    status: row.status as OfficeTask["status"],
    deadline: row.deadline as string,
    createdAt: row.created_at as string,
  };
}

// --------------- Daily Tasks ---------------

export async function getTasks(): Promise<DailyTask[]> {
  const { data, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTask);
}

export async function addTask(
  task: Omit<DailyTask, "id" | "createdAt">
): Promise<DailyTask> {
  const { data, error } = await supabase
    .from("daily_tasks")
    .insert({
      id: generateId(),
      title: task.title,
      description: task.description,
      status: task.status,
      date: task.date,
    })
    .select()
    .single();
  if (error) throw error;
  return mapTask(data);
}

export async function updateTask(
  id: string,
  updates: Partial<DailyTask>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined)
    dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.date !== undefined) dbUpdates.date = updates.date;

  const { error } = await supabase
    .from("daily_tasks")
    .update(dbUpdates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from("daily_tasks")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// --------------- Habits ---------------

export async function getHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapHabit);
}

export async function addHabit(name: string): Promise<Habit> {
  const { data, error } = await supabase
    .from("habits")
    .insert({
      id: generateId(),
      name,
      start_date: today(),
      progress: new Array(21).fill(false),
    })
    .select()
    .single();
  if (error) throw error;
  return mapHabit(data);
}

export async function toggleHabitDay(
  habitId: string,
  dayIndex: number
): Promise<void> {
  const { data, error } = await supabase
    .from("habits")
    .select("progress")
    .eq("id", habitId)
    .single();
  if (error) throw error;

  const progress = [...(data.progress as boolean[])];
  progress[dayIndex] = !progress[dayIndex];

  const { error: updateError } = await supabase
    .from("habits")
    .update({ progress })
    .eq("id", habitId);
  if (updateError) throw updateError;
}

export async function resetHabit(habitId: string): Promise<void> {
  const { error } = await supabase
    .from("habits")
    .update({
      start_date: today(),
      progress: new Array(21).fill(false),
    })
    .eq("id", habitId);
  if (error) throw error;
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) throw error;
}

// --------------- Expenses ---------------

export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapExpense);
}

export async function addExpense(
  expense: Omit<Expense, "id" | "createdAt">
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      id: generateId(),
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
    })
    .select()
    .single();
  if (error) throw error;
  return mapExpense(data);
}

export async function updateExpense(
  id: string,
  updates: Partial<Expense>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.date !== undefined) dbUpdates.date = updates.date;

  const { error } = await supabase
    .from("expenses")
    .update(dbUpdates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

// --------------- Exercise ---------------

export async function getExerciseLogs(): Promise<ExerciseLog[]> {
  const { data, error } = await supabase
    .from("exercise_logs")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ExerciseLog[];
}

export async function toggleExercise(date: string): Promise<void> {
  const { data } = await supabase
    .from("exercise_logs")
    .select("done")
    .eq("date", date)
    .maybeSingle();

  if (data) {
    const { error } = await supabase
      .from("exercise_logs")
      .update({ done: !data.done })
      .eq("date", date);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("exercise_logs")
      .insert({ date, done: true });
    if (error) throw error;
  }
}

/** Pure function — computes streak from an already-fetched logs array. */
export function computeStreak(logs: ExerciseLog[]): number {
  const doneSet = new Set(logs.filter((l) => l.done).map((l) => l.date));
  let streak = 0;
  const d = new Date();
  while (doneSet.has(d.toISOString().split("T")[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// --------------- Office Tasks ---------------

export async function getOfficeTasks(): Promise<OfficeTask[]> {
  const { data, error } = await supabase
    .from("office_tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOfficeTask);
}

export async function addOfficeTask(
  task: Omit<OfficeTask, "id" | "createdAt">
): Promise<OfficeTask> {
  const { data, error } = await supabase
    .from("office_tasks")
    .insert({
      id: generateId(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline,
    })
    .select()
    .single();
  if (error) throw error;
  return mapOfficeTask(data);
}

export async function updateOfficeTask(
  id: string,
  updates: Partial<OfficeTask>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined)
    dbUpdates.description = updates.description;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;

  const { error } = await supabase
    .from("office_tasks")
    .update(dbUpdates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteOfficeTask(id: string): Promise<void> {
  const { error } = await supabase
    .from("office_tasks")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
