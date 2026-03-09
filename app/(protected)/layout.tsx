import { AppShell } from "@/components/layout/app-shell";
import { CrmProvider } from "@/components/crm/crm-provider";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmProvider>
      <AppShell>{children}</AppShell>
    </CrmProvider>
  );
}
