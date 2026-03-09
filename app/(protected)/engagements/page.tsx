"use client";

import { useMemo, useState } from "react";
import { useCrm } from "@/components/crm/crm-provider";
import { Deliverable, Engagement, EventRecord, Task } from "@/lib/types";

const stages: Engagement["stage"][] = ["Discovery", "Audit", "Automation", "Testing", "Implementation", "Optimization", "Completed", "Paused"];
const taskStatuses: Task["status"][] = ["Not Started", "In Progress", "Waiting", "Completed", "Blocked"];
const deliverableStatuses: Deliverable["status"][] = ["Draft", "In Review", "Delivered"];

type DrawerObject =
  | { kind: "Task"; value: Task }
  | { kind: "Event"; value: EventRecord }
  | { kind: "Deliverable"; value: Deliverable }
  | null;

export default function EngagementsPage() {
  const {
    engagements,
    clients,
    tasks,
    deliverables,
    updateEngagementStage,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    createDeliverable,
    updateDeliverable,
    deleteDeliverable,
    progressForEngagement,
    timelineForEngagement
  } = useCrm();

  const [focusId, setFocusId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerObject>(null);
  const [taskForm, setTaskForm] = useState({ title: "", ownerId: "", dueDate: "", materialImpact: false });
  const [deliverableForm, setDeliverableForm] = useState({ name: "", ownerId: "" });
  const [eventPromptTask, setEventPromptTask] = useState<Task | null>(null);
  const [eventSummary, setEventSummary] = useState("");

  const focused = engagements.find((item) => item.id === focusId) ?? null;
  const scopedTasks = useMemo(() => (focused ? tasks.filter((task) => task.engagementId === focused.id) : []), [focused, tasks]);
  const scopedDeliverables = useMemo(() => (focused ? deliverables.filter((item) => item.engagementId === focused.id) : []), [deliverables, focused]);
  const timeline = useMemo(() => (focused ? timelineForEngagement(focused.id) : []), [focused, timelineForEngagement]);

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Engagements</h2>
        <p className="text-sm text-muted">Engagement list, focus workspace, tasks, deliverables, and event timeline.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {engagements.map((engagement) => (
          <button key={engagement.id} className="rounded-lg border border-line bg-panel p-3 text-left" onClick={() => setFocusId(engagement.id)}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{engagement.name}</h3>
              <span className="text-xs text-muted">{engagement.healthStatus}</span>
            </div>
            <p className="text-xs text-muted">Client: {clients.find((client) => client.id === engagement.clientId)?.name ?? "Unknown"}</p>
            <p className="text-xs text-muted">Stage: {engagement.stage}</p>
            <p className="text-xs text-muted">Progress: {progressForEngagement(engagement.id)}%</p>
          </button>
        ))}
      </div>

      {focused && (
        <div className="rounded-lg border border-line bg-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{focused.name}</h3>
              <p className="text-xs text-muted">Client: {clients.find((client) => client.id === focused.clientId)?.name ?? "Unknown"}</p>
            </div>
            <button className="rounded border border-line px-2 py-1 text-xs" onClick={() => setFocusId(null)}>Back to list</button>
          </div>

          <div className="mb-3 grid grid-cols-4 gap-2">
            <label className="text-xs text-muted">Stage</label>
            <select
              className="col-span-3 rounded border border-line bg-background px-2 py-1 text-sm"
              value={focused.stage}
              onChange={(e) => updateEngagementStage(focused.id, e.target.value as Engagement["stage"])}
            >
              {stages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </div>

          <div className="mb-4 text-sm">Progress: <span className="font-semibold">{progressForEngagement(focused.id)}%</span></div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded border border-line p-3">
              <h4 className="mb-2 font-medium">Tasks</h4>
              <div className="space-y-2">
                <input className="w-full rounded border border-line bg-background px-2 py-1 text-xs" placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm((d) => ({ ...d, title: e.target.value }))} />
                <input className="w-full rounded border border-line bg-background px-2 py-1 text-xs" placeholder="Owner ID" value={taskForm.ownerId} onChange={(e) => setTaskForm((d) => ({ ...d, ownerId: e.target.value }))} />
                <input className="w-full rounded border border-line bg-background px-2 py-1 text-xs" placeholder="Due date YYYY-MM-DD" value={taskForm.dueDate} onChange={(e) => setTaskForm((d) => ({ ...d, dueDate: e.target.value }))} />
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={taskForm.materialImpact} onChange={(e) => setTaskForm((d) => ({ ...d, materialImpact: e.target.checked }))} />Material impact</label>
                <button className="w-full rounded bg-sky-700 px-2 py-1 text-xs" onClick={() => { if (!taskForm.title || !taskForm.ownerId) return; createTask({ engagementId: focused.id, title: taskForm.title, ownerId: taskForm.ownerId, status: "Not Started", dueDate: taskForm.dueDate || undefined, materialImpact: taskForm.materialImpact }); setTaskForm({ title: "", ownerId: "", dueDate: "", materialImpact: false }); }}>Add Task</button>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                {scopedTasks.map((task) => (
                  <div key={task.id} className="rounded border border-line p-2">
                    <button className="font-medium" onClick={() => setDrawer({ kind: "Task", value: task })}>{task.title}</button>
                    <div className="mt-1 flex items-center gap-1">
                      <select className="rounded border border-line bg-background px-1 py-0.5" value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as Task["status"] })}>{taskStatuses.map((s) => <option key={s}>{s}</option>)}</select>
                      <button
                        className="rounded border border-line px-1 py-0.5"
                        onClick={() => {
                          const result = completeTask(task.id);
                          if (!result.ok && result.reason?.includes("requires event")) {
                            setEventPromptTask(task);
                          }
                        }}
                      >
                        Complete
                      </button>
                      <button className="rounded border border-line px-1 py-0.5" onClick={() => deleteTask(task.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border border-line p-3">
              <h4 className="mb-2 font-medium">Deliverables</h4>
              <div className="space-y-2">
                <input className="w-full rounded border border-line bg-background px-2 py-1 text-xs" placeholder="Deliverable name" value={deliverableForm.name} onChange={(e) => setDeliverableForm((d) => ({ ...d, name: e.target.value }))} />
                <input className="w-full rounded border border-line bg-background px-2 py-1 text-xs" placeholder="Owner ID" value={deliverableForm.ownerId} onChange={(e) => setDeliverableForm((d) => ({ ...d, ownerId: e.target.value }))} />
                <button className="w-full rounded bg-sky-700 px-2 py-1 text-xs" onClick={() => { if (!deliverableForm.name || !deliverableForm.ownerId) return; createDeliverable({ engagementId: focused.id, name: deliverableForm.name, ownerId: deliverableForm.ownerId, status: "Draft" }); setDeliverableForm({ name: "", ownerId: "" }); }}>Add Deliverable</button>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                {scopedDeliverables.map((deliverable) => (
                  <div key={deliverable.id} className="rounded border border-line p-2">
                    <button className="font-medium" onClick={() => setDrawer({ kind: "Deliverable", value: deliverable })}>{deliverable.name}</button>
                    <div className="mt-1 flex items-center gap-1">
                      <select className="rounded border border-line bg-background px-1 py-0.5" value={deliverable.status} onChange={(e) => updateDeliverable(deliverable.id, { status: e.target.value as Deliverable["status"] })}>{deliverableStatuses.map((s) => <option key={s}>{s}</option>)}</select>
                      <button className="rounded border border-line px-1 py-0.5" onClick={() => deleteDeliverable(deliverable.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border border-line p-3">
              <h4 className="mb-2 font-medium">Event Timeline</h4>
              <div className="space-y-2 text-xs">
                {timeline.map((event) => (
                  <div key={event.id} className="rounded border border-line p-2">
                    <button className="font-medium" onClick={() => setDrawer({ kind: "Event", value: event })}>{event.summary}</button>
                    <p className="text-muted">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {eventPromptTask && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-line bg-panel p-4">
            <h4 className="font-semibold">Material-impact task requires event logging</h4>
            <input className="mt-2 w-full rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Event summary" value={eventSummary} onChange={(e) => setEventSummary(e.target.value)} />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded border border-line px-2 py-1" onClick={() => { setEventPromptTask(null); setEventSummary(""); }}>Cancel</button>
              <button className="rounded bg-sky-700 px-2 py-1" onClick={() => {
                if (!eventPromptTask) return;
                const result = completeTask(eventPromptTask.id, eventSummary);
                if (result.ok) {
                  setEventPromptTask(null);
                  setEventSummary("");
                }
              }}>Log Event + Complete</button>
            </div>
          </div>
        </div>
      )}

      {drawer && (
        <aside className="fixed right-0 top-0 z-30 h-full w-[380px] border-l border-line bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold">{drawer.kind} Detail</h4>
            <button className="rounded border border-line px-2 py-1 text-xs" onClick={() => setDrawer(null)}>Close</button>
          </div>

          {drawer.kind === "Task" && (
            <div className="space-y-2 text-sm">
              <p>Title: {drawer.value.title}</p>
              <p>Status: {drawer.value.status}</p>
              <p>Owner: {drawer.value.ownerId}</p>
              <p>Due date: {drawer.value.dueDate ?? "—"}</p>
              <p>Material impact: {String(drawer.value.materialImpact)}</p>
            </div>
          )}

          {drawer.kind === "Deliverable" && (
            <div className="space-y-2 text-sm">
              <p>Name: {drawer.value.name}</p>
              <p>Status: {drawer.value.status}</p>
              <p>Owner: {drawer.value.ownerId}</p>
            </div>
          )}

          {drawer.kind === "Event" && (
            <div className="space-y-2 text-sm">
              <p>Type: {drawer.value.type}</p>
              <p>Summary: {drawer.value.summary}</p>
              <p>Owner: {drawer.value.ownerId}</p>
              <p>Created: {new Date(drawer.value.createdAt).toLocaleString()}</p>
              <p>Notification required: {String(drawer.value.clientNotificationRequired)}</p>
              <p>Notification sent: {String(drawer.value.clientNotificationSent)}</p>
            </div>
          )}
        </aside>
      )}
    </section>
  );
}
