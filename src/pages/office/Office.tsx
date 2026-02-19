import { useState, useCallback } from "react";
import { OfficeTask } from "../../types";
import { getOfficeTasks, addOfficeTask, updateOfficeTask, deleteOfficeTask, today } from "../../store";
import "./office.scss";

const PRIORITIES: OfficeTask["priority"][] = ["low", "medium", "high"];
const STATUSES: OfficeTask["status"][] = ["pending", "in-progress", "completed"];

function Office() {
  const [tasks, setTasks] = useState<OfficeTask[]>(getOfficeTasks);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<OfficeTask["priority"]>("medium");
  const [deadline, setDeadline] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState<OfficeTask["priority"]>("medium");
  const [editDeadline, setEditDeadline] = useState("");

  const refresh = useCallback(() => setTasks(getOfficeTasks()), []);

  const handleAdd = () => {
    if (!title.trim()) return;
    addOfficeTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "pending",
      deadline: deadline || today(),
    });
    setTitle("");
    setDescription("");
    setDeadline("");
    refresh();
  };

  const handleStatusChange = (id: string, status: OfficeTask["status"]) => {
    updateOfficeTask(id, { status });
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteOfficeTask(id);
    refresh();
  };

  const startEdit = (task: OfficeTask) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPriority(task.priority);
    setEditDeadline(task.deadline);
  };

  const handleEditSave = (id: string) => {
    updateOfficeTask(id, {
      title: editTitle,
      description: editDesc,
      priority: editPriority,
      deadline: editDeadline,
    });
    setEditingId(null);
    refresh();
  };

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const priorityColor = (p: string) => {
    if (p === "high") return "#f44336";
    if (p === "medium") return "#ff9800";
    return "#4caf50";
  };

  const isOverdue = (task: OfficeTask) => {
    return task.status !== "completed" && task.deadline < today();
  };

  return (
    <div className="officePage">
      <h1 className="pageTitle">Office Tasks</h1>

      {/* Add Form */}
      <div className="addForm">
        <input type="text" placeholder="Task title..." value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="text" placeholder="Description..." value={description} onChange={(e) => setDescription(e.target.value)} />
        <select value={priority} onChange={(e) => setPriority(e.target.value as OfficeTask["priority"])}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="Deadline" />
        <button className="btnPrimary" onClick={handleAdd}>Add Task</button>
      </div>

      {/* Filters */}
      <div className="filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="all">All Priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <span className="countLabel">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Task List */}
      <div className="taskList">
        {filtered.length === 0 && <p className="empty">No office tasks found.</p>}
        {filtered.map((task) => (
          <div key={task.id} className={`taskItem ${task.status === "completed" ? "done" : ""} ${isOverdue(task) ? "overdue" : ""}`}>
            {editingId === task.id ? (
              <div className="editRow">
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as OfficeTask["priority"])}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                <button className="btnSave" onClick={() => handleEditSave(task.id)}>Save</button>
                <button className="btnCancel" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <span className="priorityDot" style={{ background: priorityColor(task.priority) }} />
                <div className="taskContent">
                  <div className="taskTitleRow">
                    <span className="taskTitle">{task.title}</span>
                    <span className="priorityBadge" style={{ color: priorityColor(task.priority), borderColor: priorityColor(task.priority) }}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && <span className="taskDesc">{task.description}</span>}
                  <div className="taskMeta">
                    <span>Deadline: {task.deadline}</span>
                    {isOverdue(task) && <span className="overdueLabel">OVERDUE</span>}
                  </div>
                </div>
                <div className="taskActions">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as OfficeTask["status"])}
                    className="statusSelect"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
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

export default Office;
