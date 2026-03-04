import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DailyTask } from "../../types";
import { getTasks, addTask, updateTask, deleteTask, today } from "../../store";
import "./tasks.scss";

function Tasks() {
  const { data: tasks = [], refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");
  const [filterDate, setFilterDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const addMutation = useMutation({
    mutationFn: (task: Omit<DailyTask, "id" | "createdAt">) => addTask(task),
    onSuccess: () => refetch(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DailyTask> }) =>
      updateTask(id, updates),
    onSuccess: () => refetch(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => refetch(),
  });

  const handleAdd = () => {
    if (!title.trim()) return;
    addMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      status: "pending",
      date: today(),
    });
    setTitle("");
    setDescription("");
  };

  const handleToggle = (id: string, current: DailyTask["status"]) => {
    updateMutation.mutate({
      id,
      updates: { status: current === "completed" ? "pending" : "completed" },
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const startEdit = (task: DailyTask) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description);
  };

  const handleEditSave = (id: string) => {
    updateMutation.mutate({ id, updates: { title: editTitle, description: editDesc } });
    setEditingId(null);
  };

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterDate && t.date !== filterDate) return false;
    return true;
  });

  return (
    <div className="tasksPage">
      <h1 className="pageTitle">Daily Tasks</h1>

      {/* Add Task Form */}
      <div className="addForm">
        <input
          type="text"
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className="btnPrimary" onClick={handleAdd}>Add Task</button>
      </div>

      {/* Filters */}
      <div className="filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        {filterDate && (
          <button className="btnClear" onClick={() => setFilterDate("")}>Clear Date</button>
        )}
      </div>

      {/* Task List */}
      <div className="taskList">
        {filtered.length === 0 && <p className="empty">No tasks found. Add your first task above!</p>}
        {filtered.map((task) => (
          <div key={task.id} className={`taskItem ${task.status}`}>
            {editingId === task.id ? (
              <div className="editRow">
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                <button className="btnSave" onClick={() => handleEditSave(task.id)}>Save</button>
                <button className="btnCancel" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <div className="taskCheck" onClick={() => handleToggle(task.id, task.status)}>
                  <span className={`checkbox ${task.status === "completed" ? "checked" : ""}`} />
                </div>
                <div className="taskContent">
                  <span className="taskTitle">{task.title}</span>
                  {task.description && <span className="taskDesc">{task.description}</span>}
                  <span className="taskDate">{task.date}</span>
                </div>
                <div className="taskActions">
                  <button className="btnEdit" onClick={() => startEdit(task)}>Edit</button>
                  <button className="btnDelete" onClick={() => handleDelete(task.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tasks;
