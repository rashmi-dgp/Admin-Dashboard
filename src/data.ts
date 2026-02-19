export const menu = [
  {
    id: 1,
    title: "main",
    listItems: [
      {
        id: 1,
        title: "Dashboard",
        url: "/",
        icon: "/home.svg",
      },
    ],
  },
  {
    id: 2,
    title: "trackers",
    listItems: [
      {
        id: 1,
        title: "Daily Tasks",
        url: "/tasks",
        icon: "/form.svg",
      },
      {
        id: 2,
        title: "Habits",
        url: "/habits",
        icon: "/calendar.svg",
      },
      {
        id: 3,
        title: "Expenses",
        url: "/expenses",
        icon: "/order.svg",
      },
      {
        id: 4,
        title: "Exercise",
        url: "/exercise",
        icon: "/chart.svg",
      },
      {
        id: 5,
        title: "Office Tasks",
        url: "/office",
        icon: "/note.svg",
      },
    ],
  },
];

export const EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "shopping",
  "bills",
  "entertainment",
  "health",
  "other",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  food: "#FF6384",
  transport: "#36A2EB",
  shopping: "#FFCE56",
  bills: "#4BC0C0",
  entertainment: "#9966FF",
  health: "#FF9F40",
  other: "#C9CBCF",
};
