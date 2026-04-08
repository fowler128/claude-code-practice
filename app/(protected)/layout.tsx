import { CrmProvider } from "@/components/crm/crm-provider";
import { AppShell } from "@/components/layout/app-shell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmProvider>
      <AppShell>{children}</AppShell>
    </CrmProvider>
  );
}
