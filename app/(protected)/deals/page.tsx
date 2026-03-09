"use client";

import { useMemo, useState } from "react";
import { useCrm } from "@/components/crm/crm-provider";
import { Deal } from "@/lib/types";

const stages: Deal["stage"][] = ["Qualified", "Discovery Scheduled", "Discovery Completed", "Proposal Sent", "Negotiation", "Won", "Lost"];
const engagementStages = ["Discovery", "Audit", "Automation", "Testing", "Implementation", "Optimization", "Completed", "Paused"] as const;

export default function DealsPage() {
  const { deals, updateDeal, convertWonDealToClientAndEngagement } = useCrm();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Deal["stage"] | "All">("All");
  const [convertDealId, setConvertDealId] = useState<string | null>(null);
  const [conversion, setConversion] = useState({ clientName: "", engagementName: "", engagementOwnerId: "", engagementStage: "Discovery" as (typeof engagementStages)[number] });

  const filtered = useMemo(
    () => deals.filter((deal) => (filter === "All" || deal.stage === filter) && deal.name.toLowerCase().includes(query.toLowerCase())),
    [deals, filter, query]
  );

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Deals</h2>
        <p className="text-sm text-muted">Track deal stage and convert won deals into clients and first engagements.</p>
      </header>

      <div className="flex gap-2">
        <input className="w-72 rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Search deals" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="rounded border border-line bg-background px-2 py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as Deal["stage"] | "All")}>
          <option value="All">All Stages</option>
          {stages.map((stage) => (
            <option key={stage}>{stage}</option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-2">Deal</th><th className="p-2">Stage</th><th className="p-2">Owner</th><th className="p-2">Actions</th></tr></thead>
          <tbody>
            {filtered.map((deal) => (
              <tr key={deal.id} className="border-b border-line/50">
                <td className="p-2">{deal.name}</td>
                <td className="p-2">
                  <select className="rounded border border-line bg-background px-2 py-1" value={deal.stage} onChange={(e) => updateDeal(deal.id, { stage: e.target.value as Deal["stage"] })}>
                    {stages.map((stage) => <option key={stage}>{stage}</option>)}
                  </select>
                </td>
                <td className="p-2">{deal.ownerId}</td>
                <td className="p-2">
                  {deal.stage === "Won" ? (
                    <button
                      className="rounded bg-sky-700 px-2 py-1"
                      onClick={() => {
                        setConvertDealId(deal.id);
                        setConversion({ clientName: `${deal.name} Client`, engagementName: `${deal.name} - Initial Engagement`, engagementOwnerId: deal.ownerId, engagementStage: "Discovery" });
                      }}
                    >
                      Create Client + Engagement
                    </button>
                  ) : (
                    <span className="text-xs text-muted">Set stage to Won to convert</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {convertDealId && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xl rounded-lg border border-line bg-panel p-4">
            <h3 className="text-lg font-semibold">Deal -> Client + Engagement</h3>
            <p className="mb-3 text-xs text-muted">Creates client first, then first engagement.</p>
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded border border-line bg-background px-2 py-1" placeholder="Client name" value={conversion.clientName} onChange={(e) => setConversion((d) => ({ ...d, clientName: e.target.value }))} />
              <input className="rounded border border-line bg-background px-2 py-1" placeholder="Engagement name" value={conversion.engagementName} onChange={(e) => setConversion((d) => ({ ...d, engagementName: e.target.value }))} />
              <input className="rounded border border-line bg-background px-2 py-1" placeholder="Engagement owner" value={conversion.engagementOwnerId} onChange={(e) => setConversion((d) => ({ ...d, engagementOwnerId: e.target.value }))} />
              <select className="rounded border border-line bg-background px-2 py-1" value={conversion.engagementStage} onChange={(e) => setConversion((d) => ({ ...d, engagementStage: e.target.value as (typeof engagementStages)[number] }))}>{engagementStages.map((stage) => <option key={stage}>{stage}</option>)}</select>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded border border-line px-3 py-1" onClick={() => setConvertDealId(null)}>Cancel</button>
              <button
                className="rounded bg-sky-600 px-3 py-1"
                onClick={() => {
                  convertWonDealToClientAndEngagement({
                    dealId: convertDealId,
                    clientName: conversion.clientName,
                    engagementName: conversion.engagementName,
                    engagementOwnerId: conversion.engagementOwnerId,
                    engagementStage: conversion.engagementStage
                  });
                  setConvertDealId(null);
                }}
              >
                Convert
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
