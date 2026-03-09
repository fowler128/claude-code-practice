"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { seedData } from "@/lib/seed";
import { Client, Deal, Engagement, Lead } from "@/lib/types";

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

type Ctx = {
  leads: Lead[];
  deals: Deal[];
  clients: Client[];
  engagements: Engagement[];
  createLead: (payload: Omit<Lead, "id">) => void;
  updateLead: (id: string, patch: Partial<Omit<Lead, "id">>) => void;
  qualifyLead: (id: string) => void;
  convertQualifiedLeadToDeal: (input: DealCreateInput) => void;
  createDeal: (payload: Omit<Deal, "id">) => void;
  updateDeal: (id: string, patch: Partial<Omit<Deal, "id">>) => void;
  convertWonDealToClientAndEngagement: (input: ConvertWonDealInput) => void;
  createClient: (payload: Omit<Client, "id">) => void;
  updateClient: (id: string, patch: Partial<Omit<Client, "id">>) => void;
};

const CrmContext = createContext<Ctx | null>(null);
const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(seedData.leads);
  const [deals, setDeals] = useState<Deal[]>(seedData.deals);
  const [clients, setClients] = useState<Client[]>(seedData.clients);
  const [engagements, setEngagements] = useState<Engagement[]>(seedData.engagements);

  const value = useMemo<Ctx>(
    () => ({
      leads,
      deals,
      clients,
      engagements,
      createLead: (payload) => setLeads((prev) => [{ ...payload, id: uid("lead") }, ...prev]),
      updateLead: (id, patch) => setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead))),
      qualifyLead: (id) => setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status: "Qualified" } : lead))),
      convertQualifiedLeadToDeal: (input) => {
        const lead = leads.find((item) => item.id === input.leadId);
        if (!lead || lead.status !== "Qualified") return;

        setDeals((prev) => [
          {
            id: uid("deal"),
            leadId: input.leadId,
            name: input.name,
            stage: input.stage,
            ownerId: input.ownerId,
            value: input.value,
            nextStep: input.nextStep
          },
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

        setClients((prev) => [
          {
            id: newClientId,
            name: input.clientName,
            createdFromDealId: input.dealId
          },
          ...prev
        ]);

        setEngagements((prev) => [
          {
            id: uid("eng"),
            clientId: newClientId,
            name: input.engagementName,
            stage: input.engagementStage,
            ownerId: input.engagementOwnerId,
            healthStatus: "Green"
          },
          ...prev
        ]);
      },
      createClient: (payload) => setClients((prev) => [{ ...payload, id: uid("client") }, ...prev]),
      updateClient: (id, patch) => setClients((prev) => prev.map((client) => (client.id === id ? { ...client, ...patch } : client)))
    }),
    [clients, deals, engagements, leads]
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside CrmProvider");
  return ctx;
}
