# Daily Productivity & Life Management Tracker

A web-based productivity dashboard built with React and TypeScript that helps you manage daily tasks, build habits, track expenses, maintain exercise consistency, and organize office responsibilities — all in one place.

## Features

### Dashboard
- At-a-glance summary cards for all modules
- Interactive charts (pie, bar, progress rings)
- Click any card to jump to the detailed module

### Daily Tasks
- Add, edit, and delete tasks
- Mark tasks as completed with a single click
- Filter by status (pending/completed) and date

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
- Collapsible past month history — click the arrow to expand and see breakdowns
- Seeded with sample data (₹21,000 for previous month)

### Exercise Tracker
- One-click "Mark as Done" button for today
- Streak counter (consecutive days)
- Weekly progress bar chart (sessions per week)
- 30-day interactive calendar grid
- Stats: current streak, total sessions, last 30 days

### Office Tasks
- Add tasks with priority (Low / Medium / High) and deadline
- Status workflow: Pending → In-Progress → Completed
- Filter by status or priority
- Overdue detection with visual indicator
- Color-coded priority badges

## Tech Stack

| Category        | Technology                        |
|-----------------|-----------------------------------|
| Language        | TypeScript                        |
| Framework       | React 18                          |
| Build Tool      | Vite 4                            |
| Routing         | React Router v6                   |
| UI Components   | MUI (Material UI)                 |
| Charts          | Recharts                          |
| Styling         | SCSS / Sass                       |
| Data Storage    | localStorage (browser-based)      |

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

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

## Project Structure

```
src/
├── components/
│   ├── navbar/          # Top navigation bar
│   ├── menu/            # Sidebar navigation
│   └── footer/          # Footer component
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
├── store.ts             # localStorage CRUD operations
└── data.ts              # Menu config and constants
```

## Responsive Design

The app is fully responsive across all screen sizes:
- **Desktop (>1200px)** — Full sidebar with labels, 3-column dashboard grid
- **Tablet (768–1024px)** — Icon-only sidebar, 2-column grid
- **Mobile (<480px)** — Sidebar hidden, single-column layout, stacked forms

## Future Enhancements

- Backend integration with Node.js + Express
- Database support (MongoDB / Firebase)
- User authentication and multi-user support
- Data export (CSV/PDF reports)
- Push notifications for task deadlines
- Dark/Light theme toggle
