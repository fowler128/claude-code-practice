import { Engagement, MissionControlSeed, Severity } from "@/lib/types";

export interface AlertItem {
  key: string;
  severity: Severity;
  engagementId?: string;
  message: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateEngagementProgress(seed: MissionControlSeed, engagementId: string): number {
  const tasks = seed.tasks.filter((task) => task.engagementId === engagementId);
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((task) => task.status === "Completed").length;
  return Math.round((completed / tasks.length) * 100);
}

export function deriveAlerts(seed: MissionControlSeed, now: Date): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const record of seed.financeRecords) {
    if (!record.paymentReceived && record.dueDate && new Date(record.dueDate) < now) {
      alerts.push({ key: `invoice-${record.id}`, severity: "Critical", engagementId: record.engagementId, message: `Invoice ${record.invoiceNumber ?? record.id} past due` });
    }
  }

  for (const engagement of seed.engagements) {
    if (engagement.healthStatus === "Red") {
      alerts.push({ key: `health-${engagement.id}`, severity: "Critical", engagementId: engagement.id, message: `${engagement.name}: health is Red` });
    }

    if (engagement.nextMilestoneDueDate) {
      const daysOverdue = (now.getTime() - new Date(engagement.nextMilestoneDueDate).getTime()) / MS_PER_DAY;
      if (daysOverdue > 3) {
        alerts.push({ key: `milestone-${engagement.id}`, severity: "Critical", engagementId: engagement.id, message: `${engagement.name}: milestone overdue > 3 days` });
      }
    }
  }

  if (seed.tasks.some((task) => task.dueDate && task.status !== "Completed" && new Date(task.dueDate) < now)) {
    alerts.push({ key: "warning-overdue-task", severity: "Warning", message: "Overdue task exists" });
  }

  if (seed.events.some((event) => event.clientNotificationRequired && !event.clientNotificationSent)) {
    alerts.push({ key: "warning-client-notification", severity: "Warning", message: "Client notification required but not sent" });
  }

  if (seed.deals.some((deal) => !deal.nextStep)) {
    alerts.push({ key: "warning-deal-next-step", severity: "Warning", message: "Deal has no next step" });
  }

  const sevenDaysAgo = now.getTime() - 7 * MS_PER_DAY;
  for (const engagement of seed.engagements) {
    const recent = seed.events.some((event) => event.engagementId === engagement.id && new Date(event.createdAt).getTime() >= sevenDaysAgo);
    if (!recent) {
      alerts.push({ key: `warning-stale-events-${engagement.id}`, severity: "Warning", engagementId: engagement.id, message: `${engagement.name}: no event logged in last 7 days` });
    }
  }

  const dedup = Array.from(new Map(alerts.map((alert) => [alert.key, alert])).values());
  return dedup
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "Critical" ? -1 : 1))
    .slice(0, 5);
}

export function activeEngagements(engagements: Engagement[]): number {
  return engagements.filter((engagement) => !["Completed", "Paused"].includes(engagement.stage)).length;
}
