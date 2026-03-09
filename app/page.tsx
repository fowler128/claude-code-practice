"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { deriveAlerts, calculateEngagementProgress, activeEngagements } from "@/lib/rules";
import { seedData } from "@/lib/seed";
import { Engagement, Role } from "@/lib/types";

const stageOrder: Engagement["stage"][] = ["Discovery", "Audit", "Automation", "Testing", "Implementation", "Optimization", "Completed", "Paused"];
const roles: Role[] = ["Admin", "Operations", "Sales", "Finance", "Viewer"];

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<Role>("Admin");
  const [focusEngagementId, setFocusEngagementId] = useState<string | null>(null);

  const alerts = useMemo(() => deriveAlerts(seedData, new Date("2026-03-09")), []);

  const metrics = useMemo(
    () => [
      { label: "Active Leads", value: seedData.leads.filter((lead) => !["Converted", "Closed Lost"].includes(lead.status)).length },
      { label: "Deals in Pipeline", value: seedData.deals.filter((deal) => !["Won", "Lost"].includes(deal.stage)).length },
      { label: "Active Engagements", value: activeEngagements(seedData.engagements) },
      { label: "Overdue Tasks", value: seedData.tasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date("2026-03-09") && task.status !== "Completed").length },
      { label: "Unpaid Invoices", value: seedData.financeRecords.filter((record) => ["Sent", "Overdue"].includes(record.status) && !record.paymentReceived).length }
    ],
    []
  );

  const focused = seedData.engagements.find((engagement) => engagement.id === focusEngagementId) ?? null;

  return (
    <main className="grid h-screen grid-cols-[230px_1fr_330px] grid-rows-[64px_1fr_auto]">
      <aside className="row-span-3 border-r border-line bg-panel/60 p-3">
        <h1 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">BizDeedz Mission Control</h1>
        {[
          "Dashboard",
          "Leads",
          "Deals",
          "Clients",
          "Engagements",
          "Tasks",
          "Events",
          "Deliverables",
          "Finance"
        ].map((item, index) => (
          <div key={item} className={`mb-1 rounded-md border px-2 py-1.5 text-sm ${index === 0 ? "border-line bg-panel text-text" : "border-transparent text-muted"}`}>
            {item}
          </div>
        ))}
        <div className="mt-3 rounded-md border border-line p-2 text-xs">
          <p className="mb-1 text-muted">Role</p>
          <select className="w-full rounded border border-line bg-background p-1 text-text" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as Role)}>
            {roles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </div>
      </aside>

      <header className="col-span-2 flex items-center gap-2 border-b border-line px-3">
        <span className="text-xs text-muted">Engagement Stages</span>
        <div className="grid w-full grid-cols-8 gap-1">
          {stageOrder.map((stage) => (
            <div key={stage} className="rounded border border-line bg-panel px-1 py-1 text-center text-xs text-muted">
              {stage}
            </div>
          ))}
        </div>
      </header>

      <section className="grid grid-rows-[auto_1fr_auto]">
        <div className="grid grid-cols-5 gap-2 border-b border-line p-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded border border-line bg-panel p-2">
              <p className="text-[11px] uppercase tracking-wide text-muted">{metric.label}</p>
              <p className="text-xl font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 overflow-auto p-2">
          {seedData.engagements.map((engagement) => {
            const progress = calculateEngagementProgress(seedData, engagement.id);
            return (
              <button
                key={engagement.id}
                onClick={() => setFocusEngagementId(engagement.id)}
                className="rounded border border-line bg-panel p-3 text-left"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">{engagement.name}</p>
                  <span className="text-xs text-muted">{engagement.healthStatus}</span>
                </div>
                <p className="text-xs text-muted">Stage: {engagement.stage}</p>
                <p className="text-xs text-muted">Owner: {engagement.ownerId}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full border border-line">
                  <div className="h-full bg-sky-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted">Progress: {progress}%</p>
              </button>
            );
          })}
        </div>

        <div className="border-t border-line p-2 text-xs text-muted">
          {seedData.events.slice(0, 4).map((event) => (
            <p key={event.id}>{new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {event.summary}</p>
          ))}
        </div>
      </section>

      <aside className="row-span-2 border-l border-line p-3">
        <h2 className="mb-2 text-sm font-semibold">Operational Alerts</h2>
        {alerts.map((alert) => (
          <div key={alert.key} className={`mb-2 rounded border px-2 py-1 text-xs ${alert.severity === "Critical" ? "border-critical text-critical" : "border-warning text-warning"}`}>
            {alert.severity} — {alert.message}
          </div>
        ))}
      </aside>

      {focused && (
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-none absolute inset-[72px_338px_64px_236px] rounded-lg border border-line bg-background/95 p-3"
        >
          <div className="pointer-events-auto">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{focused.name}</h3>
              <button className="rounded border border-line px-2 py-1 text-xs" onClick={() => setFocusEngagementId(null)}>
                Back
              </button>
            </div>
            <p className="text-xs text-muted">Client: {seedData.clients.find((client) => client.id === focused.clientId)?.name}</p>
            <p className="text-xs text-muted">Offer: {focused.offerType}</p>
            <p className="text-xs text-muted">Next milestone: {focused.nextMilestone}</p>
          </div>
        </motion.section>
      )}
    </main>
  );
}
