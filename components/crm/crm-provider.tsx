"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type {
  AlertRecord,
  DealRecord,
  EngagementRecord,
  EngagementStage,
  EventEntityType,
  EventRecord,
  InvoiceRecord,
  TaskRecord
} from "@/lib/types";

interface CrmContextValue {
  deals: DealRecord[];
  engagements: EngagementRecord[];
  tasks: TaskRecord[];
  invoices: InvoiceRecord[];
  events: EventRecord[];
  alerts: AlertRecord[];
  updateEngagementStage: (engagementId: string, stage: EngagementStage, createdBy: string) => void;
  completeTask: (taskId: string, createdBy: string) => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

const initialDeals: DealRecord[] = [
  { id: "deal_1", name: "AI Readiness Audit", stage: "PROPOSAL_SENT", nextStep: "Client review call" },
  { id: "deal_2", name: "Ops Automation Sprint", stage: "NEGOTIATION" }
];

const initialEngagements: EngagementRecord[] = [
  { id: "eng_1", name: "AI Readiness Audit", stage: "DISCOVERY" },
  { id: "eng_2", name: "Workflow Automation Sprint", stage: "AUDIT" }
];

const initialTasks: TaskRecord[] = [
  { id: "task_1", title: "Discovery packet review", owner: "Turea", status: "IN_PROGRESS", dueDate: "2026-03-08", engagementId: "eng_1" },
  { id: "task_2", title: "Milestone QA checklist", owner: "Ren", status: "NOT_STARTED", dueDate: "2026-03-20", engagementId: "eng_2" },
  { id: "task_3", title: "Automation test mapping", owner: "Turea", status: "WAITING", dueDate: "2026-03-16", engagementId: "eng_2" },
  { id: "task_4", title: "Client sign-off prep", owner: "Anya", status: "COMPLETED", dueDate: "2026-03-07", engagementId: "eng_1" },
  { id: "task_5", title: "Ops handoff checklist", owner: "Ren", status: "BLOCKED", dueDate: "2026-03-11", engagementId: "eng_1" }
];

const initialInvoices: InvoiceRecord[] = [
  { id: "inv_1", invoiceNumber: "1001", status: "SENT", dueDate: "2026-03-05" },
  { id: "inv_2", invoiceNumber: "1002", status: "PAID", dueDate: "2026-03-01" }
];

const initialEvents: EventRecord[] = [
  {
    id: "evt_seed_1",
    entityType: "ENGAGEMENT",
    entityId: "eng_1",
    eventType: "STAGE_CHANGED",
    description: "AI Readiness Audit stage changed from DISCOVERY to AUDIT",
    createdBy: "system",
    createdAt: "2026-03-01T10:00:00.000Z"
  }
];

function makeEvent(params: {
  entityType: EventEntityType;
  entityId: string;
  eventType: EventRecord["eventType"];
  description: string;
  createdBy: string;
}): EventRecord {
  return {
    id: crypto.randomUUID(),
    entityType: params.entityType,
    entityId: params.entityId,
    eventType: params.eventType,
    description: params.description,
    createdBy: params.createdBy,
    createdAt: new Date().toISOString()
  };
}

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [deals] = useState<DealRecord[]>(initialDeals);
  const [engagements, setEngagements] = useState<EngagementRecord[]>(initialEngagements);
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  const [invoices] = useState<InvoiceRecord[]>(initialInvoices);
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);

  const alerts = useMemo<AlertRecord[]>(() => {
    const now = new Date("2026-03-15T00:00:00.000Z");

    const dealAlerts = deals
      .filter((deal) => !deal.nextStep || deal.nextStep.trim().length === 0)
      .map((deal) => ({ id: `deal-${deal.id}`, type: "DEAL_NO_NEXT_STEP" as const, message: `${deal.name} has no next step` }));

    const engagementAlerts = engagements
      .filter((engagement) => {
        const engagementEvents = events
          .filter((event) => event.entityType === "ENGAGEMENT" && event.entityId === engagement.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (engagementEvents.length === 0) {
          return true;
        }

        const lastEventAt = new Date(engagementEvents[0].createdAt);
        const msIn7Days = 7 * 24 * 60 * 60 * 1000;
        return now.getTime() - lastEventAt.getTime() > msIn7Days;
      })
      .map((engagement) => ({
        id: `engagement-${engagement.id}`,
        type: "ENGAGEMENT_NO_EVENT_7_DAYS" as const,
        message: `${engagement.name} has no engagement event in the last 7 days`
      }));

    const overdueTaskAlerts = tasks
      .filter((task) => task.status !== "COMPLETED" && task.dueDate && new Date(task.dueDate).getTime() < now.getTime())
      .map((task) => ({ id: `task-${task.id}`, type: "OVERDUE_TASK" as const, message: `${task.title} is overdue` }));

    const unpaidInvoiceAlerts = invoices
      .filter((invoice) => invoice.status !== "PAID")
      .map((invoice) => ({
        id: `invoice-${invoice.id}`,
        type: "UNPAID_INVOICE" as const,
        message: `Invoice #${invoice.invoiceNumber} is unpaid`
      }));

    return [...dealAlerts, ...engagementAlerts, ...overdueTaskAlerts, ...unpaidInvoiceAlerts];
  }, [deals, engagements, events, invoices, tasks]);

  const value = useMemo<CrmContextValue>(
    () => ({
      deals,
      engagements,
      tasks,
      invoices,
      events,
      alerts,
      updateEngagementStage: (engagementId, stage, createdBy) => {
        setEngagements((current) => {
          const target = current.find((engagement) => engagement.id === engagementId);
          if (!target || target.stage === stage) {
            return current;
          }

          setEvents((prev) => [
            makeEvent({
              entityType: "ENGAGEMENT",
              entityId: engagementId,
              eventType: "STAGE_CHANGED",
              description: `${target.name} stage changed from ${target.stage} to ${stage}`,
              createdBy
            }),
            ...prev
          ]);

          return current.map((engagement) => (engagement.id === engagementId ? { ...engagement, stage } : engagement));
        });
      },
      completeTask: (taskId, createdBy) => {
        setTasks((current) => {
          const target = current.find((task) => task.id === taskId);
          if (!target || target.status === "COMPLETED") {
            return current;
          }

          setEvents((prev) => [
            makeEvent({
              entityType: "TASK",
              entityId: taskId,
              eventType: "TASK_COMPLETED",
              description: `${target.title} marked completed`,
              createdBy
            }),
            ...prev
          ]);

          return current.map((task) => (task.id === taskId ? { ...task, status: "COMPLETED" } : task));
        });
      }
    }),
    [alerts, deals, engagements, events, invoices, tasks]
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error("useCrm must be used inside CrmProvider");
  }

  return context;
}
