"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrm } from "@/components/crm/crm-provider";

export default function DashboardPage() {
  const { alerts } = useCrm();

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <p className="text-sm text-slate-400">Company operations view placeholder for Phase 1.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          "Active Leads",
          "Deals in Pipeline",
          "Active Engagements",
          "Overdue Tasks"
        ].map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-300">--</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operational Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-400">No active alerts.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((alert) => (
                <li key={alert.id} className="rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-300">
                  <span className="font-medium text-slate-100">{alert.type}</span>
                  <span className="ml-2">{alert.message}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
