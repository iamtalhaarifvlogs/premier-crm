// app/dashboard/page.tsx
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { getLeads } from "@/lib/mock-data"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  let leads: any[] = []
  let error: string | null = null

  try {
    console.log("=== DashboardPage: Starting fetch ===")
    leads = await getLeads()
    console.log(`=== DashboardPage: Got ${leads.length} leads ===`)
  } catch (err: any) {
    console.error("=== DashboardPage Error ===", err)
    error = err.message || "Failed to fetch leads"
  }

  return (
    <DashboardContent 
      leads={leads} 
      error={error} 
    />
  )
}