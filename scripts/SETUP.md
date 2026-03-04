# Email Reminder Setup (Resend)

Two daily email reminders via [Resend](https://resend.com):

| Time | Email | Purpose |
|------|-------|---------|
| **10 AM IST** | Daily Kickoff | Reminder to plan tasks, exercise, habits for the day |
| **10 PM IST** | Daily Progress Report | Summary of what's been logged and what's missing |

Free tier: **100 emails/day**, **3,000/month** — more than enough.

## Why Resend over Gmail?

- **Send-only API key** — even if it leaks, no one can read your emails
- **No Gmail password stored** on disk
- **Simple API** — no SMTP config needed

---

## 1. Create a Resend Account & API Key

1. Sign up at [resend.com](https://resend.com) (free, no credit card)
2. Go to **API Keys** → **Create API Key**
3. Name it something like "dashboard-reminder"
4. Set permission to **Sending access** only
5. Copy the key (starts with `re_`)

> **Note:** On the free tier, Resend sends from `onboarding@resend.dev` and can
> only deliver to the **email you signed up with**. This is perfect for a personal
> reminder. If you want to send to other emails, you'll need to add a custom domain.

## 2. Configure `.env.local`

Update these lines in `.env.local`:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
REMINDER_EMAIL=your-email@gmail.com
```

- `RESEND_API_KEY` — the API key from step 1
- `REMINDER_EMAIL` — must match the email you signed up to Resend with (on free tier)

## 3. Test All Emails

```bash
# Morning kickoff email
npm run reminder:morning

# Evening progress report email
npm run reminder:evening

# Weekly digest (Sunday summary of the past 7 days)
npm run reminder:weekly
```

## 4. Schedule with Cron

Open your crontab:

```bash
crontab -e
```

Add these three lines (assumes your Mac timezone is set to IST):

```cron
0 10 * * * cd /Users/rgupta/cursor/Tracker_Project/Admin-Dashboard && /usr/local/bin/node scripts/send-reminder.mjs morning >> /tmp/reminder.log 2>&1
0 22 * * * cd /Users/rgupta/cursor/Tracker_Project/Admin-Dashboard && /usr/local/bin/node scripts/send-reminder.mjs evening >> /tmp/reminder.log 2>&1
0 21 * * 0 cd /Users/rgupta/cursor/Tracker_Project/Admin-Dashboard && /usr/local/bin/node scripts/send-reminder.mjs weekly >> /tmp/reminder.log 2>&1
```

> The weekly digest runs at **9 PM IST every Sunday** (`0 21 * * 0` — the `0` at the end means Sunday).
> If your Mac timezone is **UTC**, use `30 4 * * *` (10 AM IST), `30 16 * * *` (10 PM IST), and `30 15 * * 0` (9 PM IST Sunday).
>
> Check your timezone with: `date +%Z`

## 5. Verify

```bash
# Check cron is saved
crontab -l

# After the scheduled time, check the log
cat /tmp/reminder.log
```

---

## Security Notes

- The Resend API key can **only send emails** — it cannot read, delete, or access
  any inbox. If leaked, the worst case is someone sends emails from `onboarding@resend.dev`.
- `.env.local` is already in `.gitignore` (via `*.local`), so it won't be committed.
- You can revoke and regenerate the API key anytime from the Resend dashboard.
