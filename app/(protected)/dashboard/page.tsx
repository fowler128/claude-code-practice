import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <p className="text-sm text-slate-400">Company operations view placeholder for Phase 1.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          "Active Leads",
          "Deals in Pipeline",
          "Active Engagements",
          "Overdue Tasks"
        ].map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-300">--</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
