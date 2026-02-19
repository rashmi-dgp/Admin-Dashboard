export interface DailyTask {
  id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  progress: boolean[]; // 21 booleans for each day
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: "food" | "transport" | "shopping" | "bills" | "entertainment" | "health" | "other";
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface ExerciseLog {
  date: string; // YYYY-MM-DD
  done: boolean;
}

export interface OfficeTask {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  deadline: string; // YYYY-MM-DD
  createdAt: string;
}
