"use client";

import { useCrm } from "@/components/crm/crm-provider";

export default function EngagementsPage() {
  const { engagements, clients } = useCrm();

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Engagements</h2>
        <p className="text-sm text-muted">First engagements created from won deal conversions appear here.</p>
      </header>

      <div className="rounded-lg border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-2">Name</th><th className="p-2">Client</th><th className="p-2">Stage</th><th className="p-2">Owner</th></tr></thead>
          <tbody>
            {engagements.map((engagement) => (
              <tr key={engagement.id} className="border-b border-line/50">
                <td className="p-2">{engagement.name}</td>
                <td className="p-2">{clients.find((client) => client.id === engagement.clientId)?.name ?? "Unknown"}</td>
                <td className="p-2">{engagement.stage}</td>
                <td className="p-2">{engagement.ownerId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
