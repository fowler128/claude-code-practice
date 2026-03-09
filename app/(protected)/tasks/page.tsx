"use client";

import { useMemo, useState } from "react";
import { useCrm } from "@/components/crm/crm-provider";
import { Task } from "@/lib/types";

const statuses: Task["status"][] = ["Not Started", "In Progress", "Waiting", "Completed", "Blocked"];

export default function TasksPage() {
  const { tasks, engagements, createTask, updateTask, deleteTask } = useCrm();
  const [engagementId, setEngagementId] = useState(engagements[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const scoped = useMemo(() => tasks.filter((task) => !engagementId || task.engagementId === engagementId), [engagementId, tasks]);

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Tasks</h2>
        <p className="text-sm text-muted">Task CRUD table for engagement operations.</p>
      </header>

      <div className="grid grid-cols-4 gap-2 rounded-lg border border-line bg-panel p-3">
        <select className="rounded border border-line bg-background px-2 py-1 text-sm" value={engagementId} onChange={(e) => setEngagementId(e.target.value)}>
          {engagements.map((eng) => <option key={eng.id} value={eng.id}>{eng.name}</option>)}
        </select>
        <input className="rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Owner ID" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} />
        <button className="rounded bg-sky-600 px-2 py-1 text-sm" onClick={() => { if (!engagementId || !title || !ownerId) return; createTask({ engagementId, title, ownerId, status: "Not Started", materialImpact: false }); setTitle(""); setOwnerId(""); }}>Create Task</button>
      </div>

      <div className="rounded-lg border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-2">Title</th><th className="p-2">Status</th><th className="p-2">Owner</th><th className="p-2">Actions</th></tr></thead>
          <tbody>
            {scoped.map((task) => (
              <tr key={task.id} className="border-b border-line/50">
                <td className="p-2">{task.title}</td>
                <td className="p-2"><select className="rounded border border-line bg-background px-2 py-1" value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as Task["status"] })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td>
                <td className="p-2">{task.ownerId}</td>
                <td className="p-2"><button className="rounded border border-line px-2 py-1" onClick={() => deleteTask(task.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
