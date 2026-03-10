"use client";

import { useMemo, useState } from "react";
import { useCrm } from "@/components/crm/crm-provider";
import { FinanceRecord } from "@/lib/types";

const statuses: FinanceRecord["status"][] = ["Draft", "Sent", "Overdue", "Paid"];
const types: FinanceRecord["type"][] = ["Invoice", "Payment", "Credit"];

export default function FinancePage() {
  const { engagements, clients, financeRecords, createFinanceRecord, updateFinanceRecord, deleteFinanceRecord, effectiveFinanceStatus } = useCrm();

  const [engagementId, setEngagementId] = useState(engagements[0]?.id ?? "");
  const [type, setType] = useState<FinanceRecord["type"]>("Invoice");
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<FinanceRecord["status"] | "All">("All");

  const rows = useMemo(
    () => financeRecords.filter((record) => filter === "All" || effectiveFinanceStatus(record) === filter),
    [effectiveFinanceStatus, filter, financeRecords]
  );

  const summary = useMemo(() => {
    return engagements.map((engagement) => {
      const linked = financeRecords.filter((record) => record.engagementId === engagement.id);
      const total = linked.reduce((acc, record) => acc + record.amount, 0);
      const unpaid = linked
        .filter((record) => ["Sent", "Overdue"].includes(effectiveFinanceStatus(record)) && !record.paymentReceived)
        .reduce((acc, record) => acc + record.amount, 0);

      return {
        engagementId: engagement.id,
        engagementName: engagement.name,
        clientName: clients.find((client) => client.id === engagement.clientId)?.name ?? "Unknown",
        total,
        unpaid
      };
    });
  }, [clients, effectiveFinanceStatus, engagements, financeRecords]);

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Finance Records</h2>
        <p className="text-sm text-muted">Track invoice/payment status and linked engagement finance summary.</p>
      </header>

      <div className="grid grid-cols-6 gap-2 rounded-lg border border-line bg-panel p-3">
        <select className="rounded border border-line bg-background px-2 py-1 text-sm" value={engagementId} onChange={(e) => setEngagementId(e.target.value)}>
          {engagements.map((eng) => (
            <option key={eng.id} value={eng.id}>{eng.name}</option>
          ))}
        </select>
        <select className="rounded border border-line bg-background px-2 py-1 text-sm" value={type} onChange={(e) => setType(e.target.value as FinanceRecord["type"])}>
          {types.map((option) => <option key={option}>{option}</option>)}
        </select>
        <input className="rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Invoice #" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        <input className="rounded border border-line bg-background px-2 py-1 text-sm" placeholder="Due date YYYY-MM-DD" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button
          className="rounded bg-sky-700 px-3 py-1 text-sm"
          onClick={() => {
            if (!engagementId || !amount) return;
            createFinanceRecord({
              engagementId,
              type,
              amount: Number(amount),
              status: type === "Invoice" ? "Draft" : "Paid",
              invoiceNumber: invoiceNumber || undefined,
              dueDate: dueDate || undefined,
              paymentReceived: type !== "Invoice"
            });
            setAmount("");
            setInvoiceNumber("");
            setDueDate("");
          }}
        >
          Create Record
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted">Filter status:</label>
        <select className="rounded border border-line bg-background px-2 py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as FinanceRecord["status"] | "All")}>
          <option value="All">All</option>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>

      <div className="rounded-lg border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-2">Engagement</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
          <tbody>
            {rows.map((record) => (
              <tr key={record.id} className="border-b border-line/50">
                <td className="p-2">{engagements.find((eng) => eng.id === record.engagementId)?.name ?? "Unknown"}</td>
                <td className="p-2">{record.type}</td>
                <td className="p-2">${record.amount}</td>
                <td className="p-2">
                  <select
                    className="rounded border border-line bg-background px-2 py-1"
                    value={effectiveFinanceStatus(record)}
                    onChange={(e) => {
                      const next = e.target.value as FinanceRecord["status"];
                      updateFinanceRecord(record.id, {
                        status: next,
                        paymentReceived: next === "Paid"
                      });
                    }}
                  >
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <button className="rounded border border-line px-2 py-1" onClick={() => deleteFinanceRecord(record.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-line bg-panel p-3">
        <h3 className="mb-2 text-sm font-medium">Linked Engagement Finance Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {summary.map((item) => (
            <div key={item.engagementId} className="rounded border border-line bg-background p-2">
              <p className="font-medium">{item.engagementName}</p>
              <p className="text-xs text-muted">Client: {item.clientName}</p>
              <p>Total: ${item.total}</p>
              <p>Unpaid: ${item.unpaid}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
