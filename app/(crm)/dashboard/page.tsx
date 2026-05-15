// app/(CRM)/dashboard/page.tsx
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { getLeads } from "@/lib/mock-data"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  let leads: any[] = []
  let error: string | null = null

  try {
    console.log("🔄 Fetching leads from proxy...")
    leads = await getLeads()
    console.log(`✅ Loaded ${leads.length} leads successfully`)
  } catch (err: any) {
    console.error("❌ Dashboard fetch error:", err)
    error = "Failed to load leads. Check if proxy route is working."
  }

  return <DashboardContent leads={leads} error={error} />
}