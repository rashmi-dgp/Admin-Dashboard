import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Expense } from "../../types";
import { getExpenses, addExpense, updateExpense, deleteExpense, today } from "../../store";
import { EXPENSE_CATEGORIES, CATEGORY_COLORS, MONTHLY_BUDGET } from "../../data";
import "./expenses.scss";

function formatRs(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function Expenses() {
  const { data: expenses = [], refetch } = useQuery({
    queryKey: ["expenses"],
    queryFn: getExpenses,
  });

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Expense["category"]>("food");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<Expense["category"]>("food");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const addMutation = useMutation({
    mutationFn: (exp: Omit<Expense, "id" | "createdAt">) => addExpense(exp),
    onSuccess: () => refetch(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Expense> }) =>
      updateExpense(id, updates),
    onSuccess: () => refetch(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => refetch(),
  });

  const currentMonth = today().slice(0, 7);

  const handleAdd = () => {
    if (!title.trim() || !amount) return;
    addMutation.mutate({
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      date: today(),
    });
    setTitle("");
    setAmount("");
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const startEdit = (e: Expense) => {
    setEditingId(e.id);
    setEditTitle(e.title);
    setEditAmount(String(e.amount));
    setEditCategory(e.category);
  };

  const handleEditSave = (id: string) => {
    updateMutation.mutate({
      id,
      updates: { title: editTitle, amount: parseFloat(editAmount), category: editCategory },
    });
    setEditingId(null);
  };

  const toggleMonth = (ym: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(ym)) next.delete(ym);
      else next.add(ym);
      return next;
    });
  };

  const currentMonthExpenses = useMemo(
    () => expenses.filter((e) => e.date.slice(0, 7) === currentMonth),
    [expenses, currentMonth]
  );

  const pastMonthsGrouped = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    expenses.forEach((e) => {
      const ym = e.date.slice(0, 7);
      if (ym === currentMonth) return;
      if (!map[ym]) map[ym] = [];
      map[ym].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [expenses, currentMonth]);

  const filtered = filterCat === "all" ? currentMonthExpenses : currentMonthExpenses.filter((e) => e.category === filterCat);

  const totalCurrent = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => (map[e.category] = (map[e.category] || 0) + e.amount));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const month = e.date.slice(0, 7);
      map[month] = (map[month] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([name, total]) => ({ name, total }));
  }, [expenses]);

  const renderExpenseItem = (exp: Expense) => (
    <div key={exp.id} className="expenseItem">
      {editingId === exp.id ? (
        <div className="editRow">
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
          <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as Expense["category"])}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="btnSave" onClick={() => handleEditSave(exp.id)}>Save</button>
          <button className="btnCancel" onClick={() => setEditingId(null)}>Cancel</button>
        </div>
      ) : (
        <>
          <span className="catDot" style={{ background: CATEGORY_COLORS[exp.category] }} />
          <div className="expContent">
            <span className="expTitle">{exp.title}</span>
            <span className="expMeta">{exp.category} · {exp.date}</span>
          </div>
          <span className="expAmount">{formatRs(exp.amount)}</span>
          <div className="expActions">
            <button className="btnEdit" onClick={() => startEdit(exp)}>Edit</button>
            <button className="btnDelete" onClick={() => handleDelete(exp.id)}>Delete</button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="expensesPage">
      <h1 className="pageTitle">Expense Tracker</h1>

      {/* Add Expense */}
      <div className="addForm">
        <input type="text" placeholder="Expense title..." value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="1" />
        <select value={category} onChange={(e) => setCategory(e.target.value as Expense["category"])}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <button className="btnPrimary" onClick={handleAdd}>Add Expense</button>
      </div>

      {/* Charts */}
      {expenses.length > 0 && (
        <div className="chartsRow">
          <div className="chartCard">
            <h3>Spending by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatRs(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chartCard">
            <h3>Monthly Summary</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" tick={{ fill: "#ccc", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "#ccc", fontSize: 11 }} axisLine={false} />
                <Tooltip formatter={(value: number) => formatRs(value)} />
                <Bar dataKey="total" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Budget Progress */}
      <div className="budgetCard">
        <div className="budgetHeader">
          <h2>This Month</h2>
          <span className="budgetNumbers">
            {formatRs(totalCurrent)} <span className="budgetOf">/ {formatRs(MONTHLY_BUDGET)}</span>
          </span>
        </div>
        <div className="budgetBarBg">
          <div
            className={`budgetBarFill ${totalCurrent > MONTHLY_BUDGET ? "over" : totalCurrent >= MONTHLY_BUDGET * 0.8 ? "warn" : ""}`}
            style={{ width: `${Math.min((totalCurrent / MONTHLY_BUDGET) * 100, 100)}%` }}
          />
        </div>
        <div className="budgetFooter">
          <span className="budgetPercent">{Math.round((totalCurrent / MONTHLY_BUDGET) * 100)}% used</span>
          {totalCurrent > MONTHLY_BUDGET ? (
            <span className="budgetAlert over">⚠ Over budget by {formatRs(totalCurrent - MONTHLY_BUDGET)}</span>
          ) : totalCurrent >= MONTHLY_BUDGET * 0.8 ? (
            <span className="budgetAlert warn">⚠ {formatRs(MONTHLY_BUDGET - totalCurrent)} remaining — approaching limit</span>
          ) : (
            <span className="budgetRemaining">{formatRs(MONTHLY_BUDGET - totalCurrent)} remaining</span>
          )}
        </div>
      </div>

      <div className="filterRow">
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <span className="totalLabel">
          Total: <strong>{formatRs(totalFiltered)}</strong>
          {filterCat !== "all" && <span className="totalAll"> (of {formatRs(totalCurrent)} overall)</span>}
        </span>
      </div>

      <div className="expenseList">
        {filtered.length === 0 && <p className="empty">No expenses this month yet.</p>}
        {filtered.map(renderExpenseItem)}
      </div>

      {/* Past Months - Collapsible */}
      {pastMonthsGrouped.length > 0 && (
        <div className="pastMonths">
          <h2 className="pastTitle">Previous Months</h2>
          {pastMonthsGrouped.map(([ym, items]) => {
            const monthTotal = items.reduce((s, e) => s + e.amount, 0);
            const isOpen = expandedMonths.has(ym);

            return (
              <div key={ym} className="monthGroup">
                <button className="monthHeader" onClick={() => toggleMonth(ym)}>
                  <div className="monthLeft">
                    <span className="monthName">{getMonthLabel(ym)}</span>
                    <span className="monthItemCount">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="monthRight">
                    <span className="monthTotal">{formatRs(monthTotal)}</span>
                    <span className={`arrow ${isOpen ? "open" : ""}`}>▼</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="monthBody">
                    {items.map(renderExpenseItem)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Expenses;
