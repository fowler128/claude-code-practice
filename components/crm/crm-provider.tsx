"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type {
  AlertRecord,
  ArticleRecord,
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
  articles: ArticleRecord[];
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

const initialArticles: ArticleRecord[] = [
  {
    id: "art_1",
    clientId: "client_1",
    clientName: "Greenfield Solar",
    title: "How AI Is Transforming Solar Panel Installation Scheduling",
    targetKeyword: "AI solar panel installation",
    contentType: "BLOG",
    status: "PUBLISHED",
    publishedAt: "2026-02-18",
    url: "https://greenfieldsolar.com/blog/ai-solar-installation",
    gsc: { impressions: 4200, clicks: 310, ctr: 7.4, avgPosition: 8.2 },
    aeoGeoChecklist: [
      { label: "Concise direct-answer paragraph in first 100 words", passed: true },
      { label: "FAQ section with structured Q&A pairs", passed: true },
      { label: "Uses natural-language question headings (H2/H3)", passed: true },
      { label: "Includes authoritative citations and sources", passed: true },
      { label: "Content cited by at least one AI engine", passed: false },
      { label: "Entity-rich language for knowledge graph matching", passed: true },
      { label: "Optimized meta description for snippet extraction", passed: true },
      { label: "Internal links to topically related content", passed: false }
    ],
    schemaMarkup: [
      { type: "Article", snippet: '{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "How AI Is Transforming Solar Panel Installation Scheduling",\n  "author": { "@type": "Organization", "name": "Greenfield Solar" },\n  "datePublished": "2026-02-18"\n}' },
      { type: "FAQPage", snippet: '{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [\n    {\n      "@type": "Question",\n      "name": "How does AI improve solar installation?",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "AI optimizes crew routing, weather-based scheduling, and panel placement analysis."\n      }\n    }\n  ]\n}' }
    ]
  },
  {
    id: "art_2",
    clientId: "client_1",
    clientName: "Greenfield Solar",
    title: "5 Signs Your Solar Business Needs Workflow Automation",
    targetKeyword: "solar business automation",
    contentType: "BLOG",
    status: "REVIEW",
    gsc: { impressions: 0, clicks: 0, ctr: 0, avgPosition: 0 },
    aeoGeoChecklist: [
      { label: "Concise direct-answer paragraph in first 100 words", passed: true },
      { label: "FAQ section with structured Q&A pairs", passed: false },
      { label: "Uses natural-language question headings (H2/H3)", passed: true },
      { label: "Includes authoritative citations and sources", passed: false },
      { label: "Content cited by at least one AI engine", passed: false },
      { label: "Entity-rich language for knowledge graph matching", passed: true },
      { label: "Optimized meta description for snippet extraction", passed: true },
      { label: "Internal links to topically related content", passed: false }
    ],
    schemaMarkup: [
      { type: "Article", snippet: '{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "5 Signs Your Solar Business Needs Workflow Automation",\n  "author": { "@type": "Organization", "name": "Greenfield Solar" }\n}' }
    ]
  },
  {
    id: "art_3",
    clientId: "client_2",
    clientName: "Peak Performance Gym",
    title: "The Complete Guide to AI-Powered Member Retention",
    targetKeyword: "AI gym member retention",
    contentType: "BLOG",
    status: "PUBLISHED",
    publishedAt: "2026-03-02",
    url: "https://peakperformancegym.com/blog/ai-member-retention",
    gsc: { impressions: 1850, clicks: 142, ctr: 7.7, avgPosition: 12.4 },
    aeoGeoChecklist: [
      { label: "Concise direct-answer paragraph in first 100 words", passed: true },
      { label: "FAQ section with structured Q&A pairs", passed: true },
      { label: "Uses natural-language question headings (H2/H3)", passed: true },
      { label: "Includes authoritative citations and sources", passed: true },
      { label: "Content cited by at least one AI engine", passed: true },
      { label: "Entity-rich language for knowledge graph matching", passed: true },
      { label: "Optimized meta description for snippet extraction", passed: true },
      { label: "Internal links to topically related content", passed: true }
    ],
    schemaMarkup: [
      { type: "Article", snippet: '{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "The Complete Guide to AI-Powered Member Retention",\n  "author": { "@type": "Organization", "name": "Peak Performance Gym" },\n  "datePublished": "2026-03-02"\n}' },
      { type: "FAQPage", snippet: '{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [\n    {\n      "@type": "Question",\n      "name": "How does AI help retain gym members?",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "AI analyzes attendance patterns and engagement data to identify at-risk members and trigger personalized re-engagement campaigns."\n      }\n    }\n  ]\n}' }
    ]
  },
  {
    id: "art_4",
    clientId: "client_2",
    clientName: "Peak Performance Gym",
    title: "New Year Fitness Goals: How AI Personal Training Works",
    targetKeyword: "AI personal training",
    contentType: "BLOG",
    status: "DRAFTING",
    gsc: { impressions: 0, clicks: 0, ctr: 0, avgPosition: 0 },
    aeoGeoChecklist: [
      { label: "Concise direct-answer paragraph in first 100 words", passed: false },
      { label: "FAQ section with structured Q&A pairs", passed: false },
      { label: "Uses natural-language question headings (H2/H3)", passed: false },
      { label: "Includes authoritative citations and sources", passed: false },
      { label: "Content cited by at least one AI engine", passed: false },
      { label: "Entity-rich language for knowledge graph matching", passed: false },
      { label: "Optimized meta description for snippet extraction", passed: false },
      { label: "Internal links to topically related content", passed: false }
    ],
    schemaMarkup: []
  },
  {
    id: "art_5",
    clientId: "client_1",
    clientName: "Greenfield Solar",
    title: "Solar tax credits 2026 update",
    targetKeyword: "solar tax credits 2026",
    contentType: "SOCIAL",
    status: "PUBLISHED",
    publishedAt: "2026-03-10",
    gsc: { impressions: 0, clicks: 0, ctr: 0, avgPosition: 0 },
    aeoGeoChecklist: [],
    schemaMarkup: []
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
  const [articles] = useState<ArticleRecord[]>(initialArticles);
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);

  const alerts = useMemo<AlertRecord[]>(() => {
    const now = new Date();

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
      articles,
      updateEngagementStage: (engagementId, stage, createdBy) => {
        const target = engagements.find((engagement) => engagement.id === engagementId);
        if (!target || target.stage === stage) {
          return;
        }

        setEngagements((current) =>
          current.map((engagement) => (engagement.id === engagementId ? { ...engagement, stage } : engagement))
        );
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
      },
      completeTask: (taskId, createdBy) => {
        const target = tasks.find((task) => task.id === taskId);
        if (!target || target.status === "COMPLETED") {
          return;
        }

        setTasks((current) =>
          current.map((task) => (task.id === taskId ? { ...task, status: "COMPLETED" as const } : task))
        );
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
      }
    }),
    [alerts, articles, deals, engagements, events, invoices, tasks]
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
