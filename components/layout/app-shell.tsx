import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-text">
      <SidebarNav />
      <div className="flex-1">
        <header className="border-b border-line px-6 py-4">
          <h1 className="text-sm uppercase tracking-[0.12em] text-muted">BizDeedz Internal Command Center</h1>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
