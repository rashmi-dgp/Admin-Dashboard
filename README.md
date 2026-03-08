# Daily Productivity & Life Management Tracker

A web-based productivity dashboard built with React and TypeScript that helps you manage daily tasks, build habits, track expenses, maintain exercise consistency, and organize office responsibilities — all in one place. Data is persisted in **Supabase** and the app uses **React Query** for server state management.

## Features

### Dashboard
- At-a-glance summary cards for all modules
- Interactive charts (pie, bar, progress rings)
- Click any card to jump to the detailed module

### Daily Tasks
- Add, edit, and delete tasks
- Mark tasks as completed with a single click
- Filter by status (pending/completed) and date
- **Task streak counter** — tracks consecutive days with at least one completed task

### Habit Tracker (21-Day Challenge)
- Start a new habit and track 21 days of progress
- Visual day grid — click each day to mark it done
- Progress bar showing completion percentage
- Reset cycle to start over
- "Previously Learned" section shows completed habits with a green badge

### Expense Tracker
- Add, edit, and delete expenses with category tagging
- Currency in ₹ (Indian Rupees) with locale formatting
- Category-wise pie chart and monthly bar chart
- Filter expenses by category
- **Budget progress bar** — visual indicator against the ₹30,000 monthly budget with over/approaching-budget alerts
- Collapsible past month history — click the arrow to expand and see breakdowns

### Exercise Tracker
- One-click "Mark as Done" button for today
- **Streak counter** (consecutive days)
- Weekly progress bar chart (sessions per week)
- 30-day interactive calendar grid
- Stats: current streak, total sessions, last 30 days

### Office Tasks
- Add tasks with priority (Low / Medium / High) and deadline
- Status workflow: Pending → In-Progress → Completed
- Filter by status or priority
- **Overdue detection** — tasks past their deadline are visually flagged
- Color-coded priority badges

### Email Reminders
- **Morning kickoff** — daily summary of pending tasks, habits, and exercise
- **Evening progress report** — recap of what was completed during the day
- **Weekly digest** — a broader view of the week's progress across all modules
- Powered by [Resend](https://resend.com); runs on IST timezone via cron (see `scripts/SETUP.md`)

## Tech Stack

| Category        | Technology                        |
|-----------------|-----------------------------------|
| Language        | TypeScript                        |
| Framework       | React 18                          |
| Build Tool      | Vite 4                            |
| Routing         | React Router v6                   |
| Server State    | TanStack React Query v4           |
| Database        | Supabase (PostgreSQL)             |
| Email           | Resend                            |
| Charts          | Recharts                          |
| Styling         | SCSS / Sass                       |

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A [Supabase](https://supabase.com) project with the required tables

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key        # only needed for email reminders
```

### Installation

```bash
# Clone the repository
git clone https://github.com/rashmi-dgp/Admin-Dashboard.git
cd Admin-Dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

### Email Reminders

```bash
# Send morning kickoff email
npm run reminder:morning

# Send evening progress report
npm run reminder:evening

# Send weekly digest
npm run reminder:weekly
```

See `scripts/SETUP.md` for cron job configuration.

## Project Structure

```
src/
├── components/
│   ├── navbar/          # Top navigation bar
│   ├── menu/            # Sidebar navigation
│   └── footer/          # Footer component
├── lib/
│   └── supabase.ts      # Supabase client initialisation
├── pages/
│   ├── home/            # Dashboard with summary cards
│   ├── tasks/           # Daily Task module
│   ├── habits/          # 21-Day Habit Tracker
│   ├── expenses/        # Expense Tracker with charts
│   ├── exercise/        # Exercise Tracker with streaks
│   └── office/          # Office Task Manager
├── styles/
│   ├── global.scss      # Global styles and layout
│   ├── variables.scss   # Color and theme variables
│   └── responsive.scss  # Breakpoint mixins
├── App.tsx              # Router and layout setup
├── types.ts             # TypeScript interfaces for all modules
├── store.ts             # Supabase CRUD operations and helpers
└── data.ts              # Menu config, budget constant, and category colours
scripts/
├── send-reminder.mjs    # Email reminder scripts (morning / evening / weekly)
└── SETUP.md             # Cron job setup instructions
```

## Responsive Design

The app is fully responsive across all screen sizes:
- **Desktop (>1200px)** — Full sidebar with labels, 3-column dashboard grid
- **Tablet (768–1024px)** — Icon-only sidebar, 2-column grid
- **Mobile (<480px)** — Sidebar hidden, single-column layout, stacked forms

## Future Enhancements

- User authentication and multi-user support
- Data export (CSV/PDF reports)
- Push notifications for task deadlines
- Dark/Light theme toggle
