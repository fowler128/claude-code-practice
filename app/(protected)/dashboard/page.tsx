"use client";

import { useMemo, useState } from "react";
import { useCrm } from "@/components/crm/crm-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const matrixStages = ["DISCOVERY", "AUDIT", "AUTOMATION", "TESTING", "IMPLEMENTATION", "OPTIMIZATION", "PAUSED"];

export default function DashboardPage() {
  const { alerts, tasks, engagements, events } = useCrm();
  const [selectedCell, setSelectedCell] = useState<{ owner: string; stage: string } | null>(null);

  const stageByEngagementId = useMemo(
    () => Object.fromEntries(engagements.map((engagement) => [engagement.id, engagement.stage])),
    [engagements]
  );

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "COMPLETED"),
    [tasks]
  );

  const owners = useMemo(() => Array.from(new Set(openTasks.map((task) => task.owner))), [openTasks]);

  const matrixCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const task of openTasks) {
      const stage = task.engagementId ? stageByEngagementId[task.engagementId] ?? "UNASSIGNED" : "UNASSIGNED";
      const key = `${task.owner}::${stage}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return counts;
  }, [openTasks, stageByEngagementId]);

  const maxCellValue = useMemo(() => Math.max(1, ...Object.values(matrixCounts), 1), [matrixCounts]);

  const filteredTasks = useMemo(() => {
    if (!selectedCell) {
      return openTasks;
    }

    return openTasks.filter((task) => {
      const stage = task.engagementId ? stageByEngagementId[task.engagementId] ?? "UNASSIGNED" : "UNASSIGNED";
      return task.owner === selectedCell.owner && stage === selectedCell.stage;
    });
  }, [openTasks, selectedCell, stageByEngagementId]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <p className="text-sm text-slate-400">Company operations view placeholder for Phase 1.</p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {["Active Leads", "Deals in Pipeline", "Active Engagements", "Overdue Tasks"].map((label) => (
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
          <CardTitle>Work Distribution Heat Map</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-slate-800 bg-slate-900 px-3 py-2 text-left text-slate-300">Owner</th>
                  {matrixStages.map((stage) => (
                    <th key={stage} className="border border-slate-800 bg-slate-900 px-3 py-2 text-left text-slate-300">
                      {stage}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {owners.map((owner) => (
                  <tr key={owner}>
                    <td className="border border-slate-800 bg-slate-950/40 px-3 py-2 font-medium text-slate-200">{owner}</td>
                    {matrixStages.map((stage) => {
                      const key = `${owner}::${stage}`;
                      const count = matrixCounts[key] ?? 0;
                      const intensity = count === 0 ? 0.08 : 0.18 + (count / maxCellValue) * 0.62;
                      const active = selectedCell?.owner === owner && selectedCell?.stage === stage;

                      return (
                        <td key={stage} className="border border-slate-800 p-0">
                          <button
                            type="button"
                            onClick={() => setSelectedCell((current) => (current?.owner === owner && current?.stage === stage ? null : { owner, stage }))}
                            className={`flex h-12 w-full items-center justify-center text-sm transition ${active ? "ring-2 ring-sky-400" : ""}`}
                            style={{ backgroundColor: `rgba(56, 189, 248, ${intensity})` }}
                            aria-label={`Filter ${owner} ${stage} tasks`}
                          >
                            {count}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
            <p className="text-sm font-medium text-slate-200">
              {selectedCell
                ? `Filtered tasks · ${selectedCell.owner} / ${selectedCell.stage}`
                : "Filtered tasks · All owners and stages"}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {filteredTasks.length === 0 ? (
                <li className="text-slate-400">No active tasks in this selection.</li>
              ) : (
                filteredTasks.map((task) => {
                  const stage = task.engagementId ? stageByEngagementId[task.engagementId] ?? "UNASSIGNED" : "UNASSIGNED";
                  return (
                    <li key={task.id} className="rounded border border-slate-800 px-2 py-1">
                      {task.title} · {task.owner} · {stage} · {task.status}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-300">
            {events.slice(0, 8).map((event) => (
              <li key={event.id} className="rounded border border-slate-800 bg-slate-900/40 px-3 py-2">
                <p className="font-medium text-slate-100">{event.eventType}</p>
                <p>{event.description}</p>
                <p className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
