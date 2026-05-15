// app/dashboard/page.tsx
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { getLeads } from "@/lib/mock-data"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  let leads: any[] = []
  let error: string | null = null

  try {
    console.log("🔄 Fetching leads...")
    leads = await getLeads()
    console.log(`✅ Successfully fetched ${leads.length} leads`)
  } catch (err: any) {
    console.error("❌ Fetch error:", err)
    error = "Failed to load leads - Check proxy route"
  }

  return <DashboardContent leads={leads} error={error} />
}
