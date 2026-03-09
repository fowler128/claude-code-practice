"use client";

import { useMemo, useState } from "react";
import { useCrm } from "@/components/crm/crm-provider";
import { Lead } from "@/lib/types";

const statuses: Lead["status"][] = ["New", "Contacted", "Qualified", "Converted", "Closed Lost"];
const dealStages = ["Qualified", "Discovery Scheduled", "Discovery Completed", "Proposal Sent", "Negotiation", "Won", "Lost"] as const;

export default function LeadsPage() {
  const { leads, createLead, updateLead, qualifyLead, convertQualifiedLeadToDeal } = useCrm();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Lead["status"] | "All">("All");
  const [draft, setDraft] = useState({ companyName: "", contactName: "", ownerId: "", source: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [conversionLead, setConversionLead] = useState<Lead | null>(null);
  const [dealDraft, setDealDraft] = useState({ name: "", stage: "Qualified" as (typeof dealStages)[number], value: "", ownerId: "", nextStep: "" });

  const filtered = useMemo(
    () =>
      leads.filter((lead) => {
        const byStatus = filter === "All" || lead.status === filter;
        const byQuery = `${lead.companyName} ${lead.contactName}`.toLowerCase().includes(query.toLowerCase());
        return byStatus && byQuery;
      }),
    [filter, leads, query]
  );

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Leads</h2>
        <p className="text-sm text-muted">Create, edit, qualify, and convert leads into deals.</p>
      </header>

      <div className="grid grid-cols-4 gap-2 rounded-lg border border-line bg-panel p-3">
        <input className="rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Company name" value={draft.companyName} onChange={(e) => setDraft((d) => ({ ...d, companyName: e.target.value }))} />
        <input className="rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Contact name" value={draft.contactName} onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))} />
        <input className="rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Owner ID" value={draft.ownerId} onChange={(e) => setDraft((d) => ({ ...d, ownerId: e.target.value }))} />
        <button
          className="rounded bg-sky-600 px-3 py-1 text-sm"
          onClick={() => {
            if (!draft.companyName || !draft.contactName || !draft.ownerId) return;
            createLead({ ...draft, status: "New" });
            setDraft({ companyName: "", contactName: "", ownerId: "", source: "" });
          }}
        >
          Create Lead
        </button>
      </div>

      <div className="flex gap-2">
        <input className="w-72 rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Search leads" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="rounded border border-line bg-background px-2 py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as Lead["status"] | "All")}>
          <option value="All">All Statuses</option>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="p-2">Company</th><th className="p-2">Contact</th><th className="p-2">Status</th><th className="p-2">Owner</th><th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} className="border-b border-line/50">
                <td className="p-2">{editingId === lead.id ? <input className="rounded border border-line bg-background px-2 py-1" value={lead.companyName} onChange={(e) => updateLead(lead.id, { companyName: e.target.value })} /> : lead.companyName}</td>
                <td className="p-2">{editingId === lead.id ? <input className="rounded border border-line bg-background px-2 py-1" value={lead.contactName} onChange={(e) => updateLead(lead.id, { contactName: e.target.value })} /> : lead.contactName}</td>
                <td className="p-2">{lead.status}</td>
                <td className="p-2">{lead.ownerId}</td>
                <td className="p-2 space-x-1">
                  <button className="rounded border border-line px-2 py-1" onClick={() => setEditingId((v) => (v === lead.id ? null : lead.id))}>{editingId === lead.id ? "Done" : "Edit"}</button>
                  {lead.status !== "Qualified" && lead.status !== "Converted" && <button className="rounded border border-line px-2 py-1" onClick={() => qualifyLead(lead.id)}>Mark Qualified</button>}
                  {lead.status === "Qualified" && <button className="rounded bg-sky-700 px-2 py-1" onClick={() => {setConversionLead(lead); setDealDraft({ name: `${lead.companyName} Engagement`, stage: "Qualified", value: "", ownerId: lead.ownerId, nextStep: "" });}}>Convert to Deal</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {conversionLead && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xl rounded-lg border border-line bg-panel p-4">
            <h3 className="text-lg font-semibold">Convert Lead to Deal</h3>
            <p className="mb-3 text-xs text-muted">Lead status is updated to Converted only after deal creation.</p>
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded border border-line bg-background px-2 py-1" placeholder="Deal name" value={dealDraft.name} onChange={(e) => setDealDraft((d) => ({ ...d, name: e.target.value }))} />
              <select className="rounded border border-line bg-background px-2 py-1" value={dealDraft.stage} onChange={(e) => setDealDraft((d) => ({ ...d, stage: e.target.value as (typeof dealStages)[number] }))}>{dealStages.map((s) => <option key={s}>{s}</option>)}</select>
              <input className="rounded border border-line bg-background px-2 py-1" placeholder="Value" value={dealDraft.value} onChange={(e) => setDealDraft((d) => ({ ...d, value: e.target.value }))} />
              <input className="rounded border border-line bg-background px-2 py-1" placeholder="Owner ID" value={dealDraft.ownerId} onChange={(e) => setDealDraft((d) => ({ ...d, ownerId: e.target.value }))} />
              <input className="col-span-2 rounded border border-line bg-background px-2 py-1" placeholder="Next step" value={dealDraft.nextStep} onChange={(e) => setDealDraft((d) => ({ ...d, nextStep: e.target.value }))} />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded border border-line px-3 py-1" onClick={() => setConversionLead(null)}>Cancel</button>
              <button
                className="rounded bg-sky-600 px-3 py-1"
                onClick={() => {
                  convertQualifiedLeadToDeal({
                    leadId: conversionLead.id,
                    name: dealDraft.name,
                    stage: dealDraft.stage,
                    ownerId: dealDraft.ownerId,
                    value: dealDraft.value ? Number(dealDraft.value) : undefined,
                    nextStep: dealDraft.nextStep || undefined
                  });
                  setConversionLead(null);
                }}
              >
                Create Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
