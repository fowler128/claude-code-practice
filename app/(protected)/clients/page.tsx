"use client";

import { useMemo, useState } from "react";
import { useCrm } from "@/components/crm/crm-provider";

export default function ClientsPage() {
  const { clients, createClient, updateClient } = useCrm();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => clients.filter((client) => client.name.toLowerCase().includes(query.toLowerCase())), [clients, query]);

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Clients</h2>
        <p className="text-sm text-muted">Manage clients created from won deals and manual entries.</p>
      </header>

      <div className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-line bg-panel p-3">
        <input className="rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="rounded bg-sky-600 px-3 py-1 text-sm" onClick={() => { if (!name) return; createClient({ name }); setName(""); }}>Create Client</button>
      </div>

      <input className="w-72 rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Filter clients" value={query} onChange={(e) => setQuery(e.target.value)} />

      <div className="rounded-lg border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-2">Name</th><th className="p-2">Created From Deal</th><th className="p-2">Actions</th></tr></thead>
          <tbody>
            {filtered.map((client) => (
              <tr key={client.id} className="border-b border-line/50">
                <td className="p-2">
                  {editingId === client.id ? (
                    <input className="rounded border border-line bg-background px-2 py-1" value={client.name} onChange={(e) => updateClient(client.id, { name: e.target.value })} />
                  ) : (
                    client.name
                  )}
                </td>
                <td className="p-2">{client.createdFromDealId ?? "—"}</td>
                <td className="p-2">
                  <button className="rounded border border-line px-2 py-1" onClick={() => setEditingId((v) => (v === client.id ? null : client.id))}>{editingId === client.id ? "Done" : "Edit"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
