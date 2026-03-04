import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env.local") });

// ── CLI argument: "morning" or "evening" ────────────────────────────

const mode = process.argv[2] ?? "evening";

if (mode !== "morning" && mode !== "evening") {
  console.error('Usage: node scripts/send-reminder.mjs <morning|evening>');
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

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const date = todayIST();
  let subject, html, text;

  if (mode === "morning") {
    console.log(`[${new Date().toISOString()}] Sending morning kickoff…`);
    ({ html, text } = buildMorningEmail(date));
    subject = `📋 Daily Kickoff — ${date}`;
  } else {
    console.log(`[${new Date().toISOString()}] Fetching today's summary…`);
    const summary = await fetchTodaySummary();
    ({ html, text } = buildEveningEmail(summary));
    subject = `📊 Daily Progress Report — ${summary.date}`;
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

  console.log(`${mode === "morning" ? "Kickoff" : "Progress report"} sent to ${recipientEmail} (id: ${data.id})`);
}

main().catch((err) => {
  console.error("Failed to send reminder:", err);
  process.exit(1);
});
