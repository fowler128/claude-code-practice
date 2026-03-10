"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useCrm } from "@/components/crm/crm-provider";
import { Deliverable, EventRecord, FinanceRecord, Task } from "@/lib/types";

type Drawer =
  | { type: "Task"; item: Task }
  | { type: "Event"; item: EventRecord }
  | { type: "Deliverable"; item: Deliverable }
  | { type: "Finance"; item: FinanceRecord }
  | null;

export default function DashboardPage() {
  const {
    engagements,
    clients,
    tasks,
    deliverables,
    financeRecords,
    events,
    progressForEngagement,
    timelineForEngagement,
    dashboardMetrics,
    operationalAlerts
  } = useCrm();

  const [focusId, setFocusId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);

  const focused = engagements.find((engagement) => engagement.id === focusId) ?? null;
  const metrics = dashboardMetrics();
  const alerts = operationalAlerts();
  const feed = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12);

  const focusTasks = useMemo(() => (focused ? tasks.filter((task) => task.engagementId === focused.id) : []), [focused, tasks]);
  const focusDeliverables = useMemo(() => (focused ? deliverables.filter((item) => item.engagementId === focused.id) : []), [deliverables, focused]);
  const focusFinance = useMemo(() => (focused ? financeRecords.filter((item) => item.engagementId === focused.id) : []), [financeRecords, focused]);
  const focusEvents = useMemo(() => (focused ? timelineForEngagement(focused.id) : []), [focused, timelineForEngagement]);

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Company Operations View</h2>
        <p className="text-sm text-muted">Command-center view of engagements, alerts, and live activity.</p>
      </header>

      <div className="grid grid-cols-5 gap-2">
        {[{ label: "Active Leads", value: metrics.activeLeads }, { label: "Deals in Pipeline", value: metrics.dealsInPipeline }, { label: "Active Engagements", value: metrics.activeEngagements }, { label: "Overdue Tasks", value: metrics.overdueTasks }, { label: "Unpaid Invoices", value: metrics.unpaidInvoices }].map((metric) => (
          <div key={metric.label} className="rounded-lg border border-line bg-panel p-3">
            <p className="text-xs uppercase tracking-wide text-muted">{metric.label}</p>
            <p className="text-2xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-3">
        <section className="rounded-lg border border-line bg-panel p-3">
          <div className="mb-2 text-sm text-muted">Engagement Board</div>
          <div className="grid grid-cols-2 gap-2">
            {engagements.map((engagement) => (
              <button key={engagement.id} className="rounded border border-line bg-background p-3 text-left" onClick={() => setFocusId(engagement.id)}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{engagement.name}</span>
                  <span className="text-xs text-muted">{engagement.healthStatus}</span>
                </div>
                <p className="text-xs text-muted">Client: {clients.find((client) => client.id === engagement.clientId)?.name ?? "Unknown"}</p>
                <p className="text-xs text-muted">Stage: {engagement.stage}</p>
                <p className="text-xs text-muted">Owner: {engagement.ownerId}</p>
                <p className="text-xs text-muted">Progress: {progressForEngagement(engagement.id)}%</p>
              </button>
            ))}
          </div>
        </section>

        <aside className="rounded-lg border border-line bg-panel p-3">
          <div className="mb-2 text-sm text-muted">Operational Alerts</div>
          <div className="space-y-2 text-sm">
            {alerts.map((alert, idx) => (
              <div key={`${alert.message}-${idx}`} className={`rounded border p-2 ${alert.severity === "Critical" ? "border-red-400 text-red-300" : "border-yellow-400 text-yellow-200"}`}>
                <div className="text-xs uppercase">{alert.severity}</div>
                <div>{alert.message}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section className="rounded-lg border border-line bg-panel p-3">
        <h3 className="mb-2 text-sm text-muted">Activity Feed</h3>
        <div className="space-y-1 text-sm">
          {feed.map((event) => (
            <button key={event.id} className="block w-full rounded border border-line bg-background px-2 py-1 text-left" onClick={() => setDrawer({ type: "Event", item: event })}>
              {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {event.summary}
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {focused && (
          <motion.section
            key="focus"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            className="fixed inset-[72px_340px_70px_240px] z-20 overflow-auto rounded-lg border border-line bg-background p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{focused.name}</h3>
                <p className="text-xs text-muted">Client: {clients.find((client) => client.id === focused.clientId)?.name ?? "Unknown"} · Stage: {focused.stage}</p>
              </div>
              <button className="rounded border border-line px-2 py-1 text-xs" onClick={() => setFocusId(null)}>Back</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border border-line p-3">
                <h4 className="mb-2 text-sm font-medium">Tasks</h4>
                <div className="space-y-1 text-sm">
                  {focusTasks.map((task) => (
                    <button key={task.id} className="block w-full rounded border border-line bg-panel px-2 py-1 text-left" onClick={() => setDrawer({ type: "Task", item: task })}>{task.title}</button>
                  ))}
                </div>
              </div>

              <div className="rounded border border-line p-3">
                <h4 className="mb-2 text-sm font-medium">Deliverables</h4>
                <div className="space-y-1 text-sm">
                  {focusDeliverables.map((deliverable) => (
                    <button key={deliverable.id} className="block w-full rounded border border-line bg-panel px-2 py-1 text-left" onClick={() => setDrawer({ type: "Deliverable", item: deliverable })}>{deliverable.name}</button>
                  ))}
                </div>
              </div>

              <div className="rounded border border-line p-3">
                <h4 className="mb-2 text-sm font-medium">Finance</h4>
                <div className="space-y-1 text-sm">
                  {focusFinance.map((record) => (
                    <button key={record.id} className="block w-full rounded border border-line bg-panel px-2 py-1 text-left" onClick={() => setDrawer({ type: "Finance", item: record })}>
                      Invoice {record.invoiceNumber ?? record.id} · {record.status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded border border-line p-3">
                <h4 className="mb-2 text-sm font-medium">Event Timeline</h4>
                <div className="space-y-1 text-sm">
                  {focusEvents.map((event) => (
                    <button key={event.id} className="block w-full rounded border border-line bg-panel px-2 py-1 text-left" onClick={() => setDrawer({ type: "Event", item: event })}>{event.summary}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawer && (
          <motion.aside
            key="drawer"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            className="fixed right-0 top-0 z-30 h-full w-[360px] border-l border-line bg-background p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-semibold">{drawer.type} Detail</h4>
              <button className="rounded border border-line px-2 py-1 text-xs" onClick={() => setDrawer(null)}>Close</button>
            </div>

            {drawer.type === "Task" && (
              <div className="space-y-1 text-sm">
                <p>Title: {drawer.item.title}</p>
                <p>Status: {drawer.item.status}</p>
                <p>Owner: {drawer.item.ownerId}</p>
                <p>Material impact: {String(drawer.item.materialImpact)}</p>
              </div>
            )}

            {drawer.type === "Event" && (
              <div className="space-y-1 text-sm">
                <p>Type: {drawer.item.type}</p>
                <p>Summary: {drawer.item.summary}</p>
                <p>Owner: {drawer.item.ownerId}</p>
                <p>Created: {new Date(drawer.item.createdAt).toLocaleString()}</p>
              </div>
            )}

            {drawer.type === "Deliverable" && (
              <div className="space-y-1 text-sm">
                <p>Name: {drawer.item.name}</p>
                <p>Status: {drawer.item.status}</p>
                <p>Owner: {drawer.item.ownerId}</p>
              </div>
            )}

            {drawer.type === "Finance" && (
              <div className="space-y-1 text-sm">
                <p>Type: {drawer.item.type}</p>
                <p>Invoice: {drawer.item.invoiceNumber ?? drawer.item.id}</p>
                <p>Amount: ${drawer.item.amount}</p>
                <p>Status: {drawer.item.status}</p>
                <p>Payment received: {String(drawer.item.paymentReceived)}</p>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </section>
  );
}
