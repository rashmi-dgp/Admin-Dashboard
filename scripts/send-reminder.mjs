import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env.local") });

// ── CLI argument: "morning" or "evening" ────────────────────────────

const mode = process.argv[2] ?? "evening";

if (!["morning", "evening", "weekly"].includes(mode)) {
  console.error('Usage: node scripts/send-reminder.mjs <morning|evening|weekly>');
  process.exit(1);
}

// ── Config ──────────────────────────────────────────────────────────

const {
  VITE_SUPABASE_URL: supabaseUrl,
  VITE_SUPABASE_ANON_KEY: supabaseKey,
  RESEND_API_KEY: resendApiKey,
  REMINDER_EMAIL: recipientEmail,
} = process.env;

const missing = [];
if (!supabaseUrl) missing.push("VITE_SUPABASE_URL");
if (!supabaseKey) missing.push("VITE_SUPABASE_ANON_KEY");
if (!resendApiKey) missing.push("RESEND_API_KEY");
if (!recipientEmail) missing.push("REMINDER_EMAIL");

if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  console.error("Add them to .env.local — see scripts/SETUP.md for instructions.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(resendApiKey);

// ── Helpers ─────────────────────────────────────────────────────────

function todayIST() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60000);
  return ist.toISOString().split("T")[0];
}

async function fetchTodaySummary() {
  const date = todayIST();

  const [tasks, expenses, exercise, officeTasks] = await Promise.all([
    supabase.from("daily_tasks").select("*").eq("date", date),
    supabase.from("expenses").select("*").eq("date", date),
    supabase.from("exercise_logs").select("*").eq("date", date).maybeSingle(),
    supabase.from("office_tasks").select("*"),
  ]);

  const taskRows = tasks.data ?? [];
  const expenseRows = expenses.data ?? [];
  const exerciseRow = exercise.data;
  const officeRows = officeTasks.data ?? [];

  const completedTasks = taskRows.filter((t) => t.status === "completed").length;
  const pendingTasks = taskRows.filter((t) => t.status === "pending").length;
  const totalExpenses = expenseRows.reduce((sum, e) => sum + Number(e.amount), 0);
  const exerciseDone = exerciseRow?.done === true;
  const overdueOffice = officeRows.filter(
    (t) => t.status !== "completed" && t.deadline < date
  ).length;

  return {
    date,
    tasks: { total: taskRows.length, completed: completedTasks, pending: pendingTasks },
    expenses: { count: expenseRows.length, total: totalExpenses },
    exercise: { logged: !!exerciseRow, done: exerciseDone },
    office: { total: officeRows.length, overdue: overdueOffice },
  };
}

function daysAgoIST(n) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60000);
  ist.setDate(ist.getDate() - n);
  return ist.toISOString().split("T")[0];
}

async function fetchWeeklySummary() {
  const today = todayIST();
  const weekStart = daysAgoIST(6);

  const [tasks, expenses, exerciseLogs, officeTasks, habits] = await Promise.all([
    supabase.from("daily_tasks").select("*").gte("date", weekStart).lte("date", today),
    supabase.from("expenses").select("*").gte("date", weekStart).lte("date", today),
    supabase.from("exercise_logs").select("*").gte("date", weekStart).lte("date", today),
    supabase.from("office_tasks").select("*"),
    supabase.from("habits").select("*"),
  ]);

  const taskRows = tasks.data ?? [];
  const expenseRows = expenses.data ?? [];
  const exerciseRows = exerciseLogs.data ?? [];
  const officeRows = officeTasks.data ?? [];
  const habitRows = habits.data ?? [];

  const completedTasks = taskRows.filter((t) => t.status === "completed").length;
  const totalTasks = taskRows.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalSpent = expenseRows.reduce((sum, e) => sum + Number(e.amount), 0);
  const categoryBreakdown = {};
  for (const e of expenseRows) {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + Number(e.amount);
  }

  const exerciseDays = exerciseRows.filter((e) => e.done).length;

  const completedOffice = officeRows.filter((t) => t.status === "completed").length;
  const overdueOffice = officeRows.filter(
    (t) => t.status !== "completed" && t.deadline < today
  ).length;

  const activeHabits = habitRows.length;
  const habitsSummary = habitRows.map((h) => {
    const done = (h.progress || []).filter(Boolean).length;
    return { name: h.name, done, total: 21 };
  });

  return {
    weekStart,
    weekEnd: today,
    tasks: { total: totalTasks, completed: completedTasks, completionRate },
    expenses: { count: expenseRows.length, total: totalSpent, categories: categoryBreakdown },
    exercise: { daysWorkedOut: exerciseDays, outOf: 7 },
    office: { total: officeRows.length, completed: completedOffice, overdue: overdueOffice },
    habits: { active: activeHabits, details: habitsSummary },
  };
}

// ── Morning Email Builder ───────────────────────────────────────────

function buildMorningEmail(date) {
  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#1e293b;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:24px 28px">
      <h1 style="margin:0;color:#fff;font-size:20px">Daily Kickoff</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px">${date}</p>
    </div>
    <div style="padding:24px 28px;color:#e2e8f0">

      <p style="font-size:15px;line-height:1.6;margin:0 0 20px">
        Good morning! Time to plan your day. Open the dashboard and set up:
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#fbbf24">📝</td>
          <td style="padding:10px 0;color:#e2e8f0">Add your <strong>daily tasks</strong></td>
        </tr>
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#fbbf24">🏋️</td>
          <td style="padding:10px 0;color:#e2e8f0">Plan your <strong>exercise</strong> for today</td>
        </tr>
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#fbbf24">💼</td>
          <td style="padding:10px 0;color:#e2e8f0">Review <strong>office tasks</strong> and deadlines</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#fbbf24">✅</td>
          <td style="padding:10px 0;color:#e2e8f0">Check in on your <strong>habits</strong></td>
        </tr>
      </table>

      <div style="margin-top:24px;padding:16px;background:#334155;border-radius:8px;text-align:center">
        <p style="margin:0 0 4px;font-size:13px;color:#94a3b8">A good day starts with a plan. You've got this!</p>
        <p style="margin:0;font-size:12px;color:#64748b">Your progress report will arrive at 10 PM IST.</p>
      </div>

    </div>
  </div>`;

  const text = [
    `Daily Kickoff — ${date}`,
    "",
    "Good morning! Time to plan your day:",
    "  - Add your daily tasks",
    "  - Plan your exercise",
    "  - Review office tasks and deadlines",
    "  - Check in on your habits",
    "",
    "Your progress report will arrive at 10 PM IST.",
  ].join("\n");

  return { html, text };
}

// ── Evening Email Builder ───────────────────────────────────────────

function buildEveningEmail(summary) {
  const { date, tasks, expenses, exercise, office } = summary;

  const statusBadge = (ok) =>
    ok
      ? '<span style="color:#4caf50;font-weight:bold">✓</span>'
      : '<span style="color:#ff9800;font-weight:bold">✗ Needs update</span>';

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#1e293b;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 28px">
      <h1 style="margin:0;color:#fff;font-size:20px">Daily Progress Report</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px">${date}</p>
    </div>
    <div style="padding:24px 28px;color:#e2e8f0">

      <h3 style="margin:0 0 12px;color:#a5b4fc;font-size:14px;text-transform:uppercase;letter-spacing:1px">Today's Summary</h3>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#94a3b8">📝 Daily Tasks</td>
          <td style="padding:10px 0;text-align:right">
            ${tasks.total === 0
              ? statusBadge(false)
              : `${tasks.completed} done / ${tasks.pending} pending`}
          </td>
        </tr>
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#94a3b8">💰 Expenses</td>
          <td style="padding:10px 0;text-align:right">
            ${expenses.count === 0
              ? statusBadge(false)
              : `${expenses.count} entries — ₹${expenses.total.toLocaleString("en-IN")}`}
          </td>
        </tr>
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#94a3b8">🏋️ Exercise</td>
          <td style="padding:10px 0;text-align:right">
            ${!exercise.logged
              ? statusBadge(false)
              : exercise.done
                ? statusBadge(true) + " Done"
                : "Logged — not done"}
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#94a3b8">💼 Office Tasks</td>
          <td style="padding:10px 0;text-align:right">
            ${office.overdue > 0
              ? `<span style="color:#ef4444;font-weight:bold">${office.overdue} overdue</span>`
              : statusBadge(true) + ` ${office.total} tracked`}
          </td>
        </tr>
      </table>

      <div style="margin-top:24px;padding:16px;background:#334155;border-radius:8px;text-align:center">
        <p style="margin:0 0 4px;font-size:13px;color:#94a3b8">Anything missing? Open the dashboard and log it now.</p>
        <p style="margin:0;font-size:12px;color:#64748b">This report is sent daily at 10 PM IST.</p>
      </div>

    </div>
  </div>`;

  const text = [
    `Daily Progress Report — ${date}`,
    "",
    `Tasks: ${tasks.completed} completed, ${tasks.pending} pending (${tasks.total} total)`,
    `Expenses: ${expenses.count} entries — ₹${expenses.total}`,
    `Exercise: ${exercise.done ? "Done" : exercise.logged ? "Logged, not done" : "Not logged"}`,
    `Office: ${office.total} tasks, ${office.overdue} overdue`,
    "",
    "Open your Productivity Tracker to update anything missing!",
  ].join("\n");

  return { html, text };
}

// ── Weekly Email Builder ────────────────────────────────────────────

function buildWeeklyEmail(summary) {
  const { weekStart, weekEnd, tasks, expenses, exercise, office, habits } = summary;

  const categoryRows = Object.entries(expenses.categories)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([cat, amt]) =>
        `<tr style="border-bottom:1px solid #334155">
          <td style="padding:6px 0;color:#94a3b8;text-transform:capitalize">${cat}</td>
          <td style="padding:6px 0;text-align:right">₹${Number(amt).toLocaleString("en-IN")}</td>
        </tr>`
    )
    .join("");

  const habitRows = habits.details
    .map(
      (h) =>
        `<tr style="border-bottom:1px solid #334155">
          <td style="padding:6px 0;color:#94a3b8">${h.name}</td>
          <td style="padding:6px 0;text-align:right">${h.done}/${h.total} days</td>
        </tr>`
    )
    .join("");

  const taskBar = tasks.completionRate;
  const exerciseBar = Math.round((exercise.daysWorkedOut / exercise.outOf) * 100);

  const progressBar = (pct, color) =>
    `<div style="background:#334155;border-radius:4px;height:8px;margin-top:4px">
      <div style="background:${color};height:8px;border-radius:4px;width:${pct}%"></div>
    </div>`;

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#1e293b;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#059669,#10b981);padding:24px 28px">
      <h1 style="margin:0;color:#fff;font-size:20px">Weekly Digest</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px">${weekStart} → ${weekEnd}</p>
    </div>
    <div style="padding:24px 28px;color:#e2e8f0">

      <!-- Tasks -->
      <h3 style="margin:0 0 8px;color:#6ee7b7;font-size:14px;text-transform:uppercase;letter-spacing:1px">📝 Tasks</h3>
      <p style="margin:0;font-size:14px">${tasks.completed} completed out of ${tasks.total} — <strong>${tasks.completionRate}%</strong></p>
      ${progressBar(taskBar, "#6366f1")}

      <div style="height:20px"></div>

      <!-- Exercise -->
      <h3 style="margin:0 0 8px;color:#6ee7b7;font-size:14px;text-transform:uppercase;letter-spacing:1px">🏋️ Exercise</h3>
      <p style="margin:0;font-size:14px">${exercise.daysWorkedOut} out of ${exercise.outOf} days — <strong>${exerciseBar}%</strong></p>
      ${progressBar(exerciseBar, "#f59e0b")}

      <div style="height:20px"></div>

      <!-- Expenses -->
      <h3 style="margin:0 0 8px;color:#6ee7b7;font-size:14px;text-transform:uppercase;letter-spacing:1px">💰 Expenses</h3>
      <p style="margin:0 0 8px;font-size:14px">Total spent: <strong>₹${expenses.total.toLocaleString("en-IN")}</strong> (${expenses.count} entries)</p>
      ${categoryRows
        ? `<table style="width:100%;border-collapse:collapse;font-size:13px">${categoryRows}</table>`
        : '<p style="color:#94a3b8;font-size:13px">No expenses logged this week.</p>'}

      <div style="height:20px"></div>

      <!-- Office Tasks -->
      <h3 style="margin:0 0 8px;color:#6ee7b7;font-size:14px;text-transform:uppercase;letter-spacing:1px">💼 Office Tasks</h3>
      <p style="margin:0;font-size:14px">${office.total} total — ${office.completed} completed${office.overdue > 0 ? `, <span style="color:#ef4444;font-weight:bold">${office.overdue} overdue</span>` : ""}</p>

      <div style="height:20px"></div>

      <!-- Habits -->
      <h3 style="margin:0 0 8px;color:#6ee7b7;font-size:14px;text-transform:uppercase;letter-spacing:1px">✅ Habits (21-day tracker)</h3>
      ${habitRows
        ? `<table style="width:100%;border-collapse:collapse;font-size:13px">${habitRows}</table>`
        : '<p style="color:#94a3b8;font-size:13px">No active habits.</p>'}

      <div style="margin-top:24px;padding:16px;background:#334155;border-radius:8px;text-align:center">
        <p style="margin:0 0 4px;font-size:13px;color:#94a3b8">Review your week and plan ahead for the next one!</p>
        <p style="margin:0;font-size:12px;color:#64748b">This digest is sent every Sunday at 9 PM IST.</p>
      </div>

    </div>
  </div>`;

  const catText = Object.entries(expenses.categories)
    .map(([cat, amt]) => `  ${cat}: ₹${amt}`)
    .join("\n");

  const habitText = habits.details
    .map((h) => `  ${h.name}: ${h.done}/${h.total} days`)
    .join("\n");

  const text = [
    `Weekly Digest — ${weekStart} → ${weekEnd}`,
    "",
    `Tasks: ${tasks.completed}/${tasks.total} completed (${tasks.completionRate}%)`,
    `Exercise: ${exercise.daysWorkedOut}/${exercise.outOf} days`,
    `Expenses: ₹${expenses.total} (${expenses.count} entries)`,
    catText ? `  Breakdown:\n${catText}` : "",
    `Office: ${office.total} total, ${office.completed} completed, ${office.overdue} overdue`,
    `Habits (${habits.active} active):`,
    habitText || "  None",
    "",
    "Review your week and plan ahead!",
  ].join("\n");

  return { html, text };
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const date = todayIST();
  let subject, html, text, label;

  if (mode === "morning") {
    console.log(`[${new Date().toISOString()}] Sending morning kickoff…`);
    ({ html, text } = buildMorningEmail(date));
    subject = `📋 Daily Kickoff — ${date}`;
    label = "Kickoff";
  } else if (mode === "weekly") {
    console.log(`[${new Date().toISOString()}] Fetching weekly summary…`);
    const summary = await fetchWeeklySummary();
    ({ html, text } = buildWeeklyEmail(summary));
    subject = `📈 Weekly Digest — ${summary.weekStart} → ${summary.weekEnd}`;
    label = "Weekly digest";
  } else {
    console.log(`[${new Date().toISOString()}] Fetching today's summary…`);
    const summary = await fetchTodaySummary();
    ({ html, text } = buildEveningEmail(summary));
    subject = `📊 Daily Progress Report — ${summary.date}`;
    label = "Progress report";
  }

  const { data, error } = await resend.emails.send({
    from: "Productivity Tracker <onboarding@resend.dev>",
    to: [recipientEmail],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }

  console.log(`${label} sent to ${recipientEmail} (id: ${data.id})`);
}

main().catch((err) => {
  console.error("Failed to send reminder:", err);
  process.exit(1);
});
