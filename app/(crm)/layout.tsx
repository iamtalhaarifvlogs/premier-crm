import { CRMProvider } from "@/lib/crm-context"
import { AppShell } from "@/components/app-shell"
import { LeadDetailsPanel } from "@/components/lead-details/lead-details-panel"

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CRMProvider>
      <AppShell>
        {children}
        <LeadDetailsPanel />
      </AppShell>
    </CRMProvider>
  )
}