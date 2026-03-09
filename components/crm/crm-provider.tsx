"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { seedData } from "@/lib/seed";
import { Client, Deal, Deliverable, Engagement, EventRecord, Lead, Task } from "@/lib/types";

type DealCreateInput = {
  leadId: string;
  name: string;
  stage: Deal["stage"];
  ownerId: string;
  value?: number;
  nextStep?: string;
};

type ConvertWonDealInput = {
  dealId: string;
  clientName: string;
  engagementName: string;
  engagementOwnerId: string;
  engagementStage: Engagement["stage"];
};

type TaskCreateInput = Omit<Task, "id">;
type DeliverableCreateInput = Omit<Deliverable, "id">;

type Ctx = {
  leads: Lead[];
  deals: Deal[];
  clients: Client[];
  engagements: Engagement[];
  tasks: Task[];
  events: EventRecord[];
  deliverables: Deliverable[];
  createLead: (payload: Omit<Lead, "id">) => void;
  updateLead: (id: string, patch: Partial<Omit<Lead, "id">>) => void;
  qualifyLead: (id: string) => void;
  convertQualifiedLeadToDeal: (input: DealCreateInput) => void;
  createDeal: (payload: Omit<Deal, "id">) => void;
  updateDeal: (id: string, patch: Partial<Omit<Deal, "id">>) => void;
  convertWonDealToClientAndEngagement: (input: ConvertWonDealInput) => void;
  createClient: (payload: Omit<Client, "id">) => void;
  updateClient: (id: string, patch: Partial<Omit<Client, "id">>) => void;
  updateEngagementStage: (engagementId: string, stage: Engagement["stage"]) => void;
  createTask: (payload: TaskCreateInput) => void;
  updateTask: (id: string, patch: Partial<Omit<Task, "id">>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string, eventSummary?: string) => { ok: boolean; reason?: string };
  createDeliverable: (payload: DeliverableCreateInput) => void;
  updateDeliverable: (id: string, patch: Partial<Omit<Deliverable, "id">>) => void;
  deleteDeliverable: (id: string) => void;
  progressForEngagement: (engagementId: string) => number;
  timelineForEngagement: (engagementId: string) => EventRecord[];
};

const CrmContext = createContext<Ctx | null>(null);
const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(seedData.leads);
  const [deals, setDeals] = useState<Deal[]>(seedData.deals);
  const [clients, setClients] = useState<Client[]>(seedData.clients);
  const [engagements, setEngagements] = useState<Engagement[]>(seedData.engagements);
  const [tasks, setTasks] = useState<Task[]>(seedData.tasks);
  const [events, setEvents] = useState<EventRecord[]>(seedData.events);
  const [deliverables, setDeliverables] = useState<Deliverable[]>(seedData.deliverables);

  const addEvent = (event: Omit<EventRecord, "id" | "createdAt">) => {
    setEvents((prev) => [{ id: uid("event"), createdAt: new Date().toISOString(), ...event }, ...prev]);
  };

  const progressForEngagement = (engagementId: string) => {
    const scoped = tasks.filter((task) => task.engagementId === engagementId);
    if (scoped.length === 0) return 0;
    const completed = scoped.filter((task) => task.status === "Completed").length;
    return Math.round((completed / scoped.length) * 100);
  };

  const timelineForEngagement = (engagementId: string) =>
    events
      .filter((event) => event.engagementId === engagementId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const value = useMemo<Ctx>(
    () => ({
      leads,
      deals,
      clients,
      engagements,
      tasks,
      events,
      deliverables,
      createLead: (payload) => setLeads((prev) => [{ ...payload, id: uid("lead") }, ...prev]),
      updateLead: (id, patch) => setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead))),
      qualifyLead: (id) => setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status: "Qualified" } : lead))),
      convertQualifiedLeadToDeal: (input) => {
        const lead = leads.find((item) => item.id === input.leadId);
        if (!lead || lead.status !== "Qualified") return;

        setDeals((prev) => [
          { id: uid("deal"), leadId: input.leadId, name: input.name, stage: input.stage, ownerId: input.ownerId, value: input.value, nextStep: input.nextStep },
          ...prev
        ]);
        setLeads((prev) => prev.map((item) => (item.id === input.leadId ? { ...item, status: "Converted" } : item)));
      },
      createDeal: (payload) => setDeals((prev) => [{ ...payload, id: uid("deal") }, ...prev]),
      updateDeal: (id, patch) => setDeals((prev) => prev.map((deal) => (deal.id === id ? { ...deal, ...patch } : deal))),
      convertWonDealToClientAndEngagement: (input) => {
        const deal = deals.find((item) => item.id === input.dealId);
        if (!deal || deal.stage !== "Won") return;

        const newClientId = uid("client");
        setClients((prev) => [{ id: newClientId, name: input.clientName, createdFromDealId: input.dealId }, ...prev]);
        setEngagements((prev) => [{ id: uid("eng"), clientId: newClientId, name: input.engagementName, stage: input.engagementStage, ownerId: input.engagementOwnerId, healthStatus: "Green" }, ...prev]);
      },
      createClient: (payload) => setClients((prev) => [{ ...payload, id: uid("client") }, ...prev]),
      updateClient: (id, patch) => setClients((prev) => prev.map((client) => (client.id === id ? { ...client, ...patch } : client))),
      updateEngagementStage: (engagementId, stage) => {
        setEngagements((prev) => prev.map((eng) => (eng.id === engagementId ? { ...eng, stage } : eng)));
        addEvent({ engagementId, type: "Stage Change", summary: `Engagement moved to ${stage}`, ownerId: "system", clientNotificationRequired: false, clientNotificationSent: false });
      },
      createTask: (payload) => setTasks((prev) => [{ ...payload, id: uid("task") }, ...prev]),
      updateTask: (id, patch) => setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...patch } : task))),
      deleteTask: (id) => setTasks((prev) => prev.filter((task) => task.id !== id)),
      completeTask: (id, eventSummary) => {
        const task = tasks.find((item) => item.id === id);
        if (!task) return { ok: false, reason: "Task not found" };

        if (task.materialImpact && !eventSummary) {
          return { ok: false, reason: "Material-impact task requires event logging" };
        }

        setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, status: "Completed" } : item)));
        if (eventSummary) {
          addEvent({ engagementId: task.engagementId, type: "Task Update", summary: eventSummary, ownerId: task.ownerId, clientNotificationRequired: false, clientNotificationSent: false });
        }
        return { ok: true };
      },
      createDeliverable: (payload) => setDeliverables((prev) => [{ ...payload, id: uid("deliverable") }, ...prev]),
      updateDeliverable: (id, patch) => {
        const current = deliverables.find((item) => item.id === id);
        if (!current) return;

        const nextStatus = patch.status ?? current.status;
        setDeliverables((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

        if (current.status !== "Delivered" && nextStatus === "Delivered") {
          addEvent({
            engagementId: current.engagementId,
            type: "Deliverable Update",
            summary: `${current.name} marked Delivered`,
            ownerId: current.ownerId,
            clientNotificationRequired: false,
            clientNotificationSent: false
          });
        }
      },
      deleteDeliverable: (id) => setDeliverables((prev) => prev.filter((item) => item.id !== id)),
      progressForEngagement,
      timelineForEngagement
    }),
    [clients, deals, deliverables, engagements, events, leads, tasks]
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside CrmProvider");
  return ctx;
}
