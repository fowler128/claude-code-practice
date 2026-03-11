"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { EngagementRecord, EngagementStage, EventEntityType, EventRecord, TaskRecord } from "@/lib/types";

interface CrmContextValue {
  engagements: EngagementRecord[];
  tasks: TaskRecord[];
  events: EventRecord[];
  updateEngagementStage: (engagementId: string, stage: EngagementStage, createdBy: string) => void;
  completeTask: (taskId: string, createdBy: string) => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

const initialEngagements: EngagementRecord[] = [
  { id: "eng_1", name: "AI Readiness Audit", stage: "DISCOVERY" },
  { id: "eng_2", name: "Workflow Automation Sprint", stage: "AUDIT" }
];

const initialTasks: TaskRecord[] = [
  { id: "task_1", title: "Discovery packet review", status: "IN_PROGRESS", engagementId: "eng_1" },
  { id: "task_2", title: "Milestone QA checklist", status: "NOT_STARTED", engagementId: "eng_2" }
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
  const [engagements, setEngagements] = useState<EngagementRecord[]>(initialEngagements);
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  const [events, setEvents] = useState<EventRecord[]>([]);

  const value = useMemo<CrmContextValue>(
    () => ({
      engagements,
      tasks,
      events,
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
    [engagements, tasks, events]
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
