// app/dashboard/page.tsx
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import {
  getLeads,
  getMessages,
  getWorkflowLogs,
  getStageHistory,
  getVehicleMatches,
} from "@/lib/mock-data"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  let leads: any[] = []
  let messages: Record<string, any[]> = {}
  let workflowLogs: any[] = []
  let stageHistory: Record<string, any[]> = {}
  let vehicleMatches: any[] = []
  let error: string | null = null

  try {
    console.log("🚀 Fetching all dashboard data...")

    const data = await Promise.all([
      getLeads(),
      getMessages(),
      getWorkflowLogs(),
      getStageHistory(),
      getVehicleMatches(),
    ])

    leads = data[0]
    messages = data[1]
    workflowLogs = data[2]
    stageHistory = data[3]
    vehicleMatches = data[4]

    console.log(`✅ Dashboard data loaded | Leads: ${leads.length}`)
  } catch (err: any) {
    console.error("❌ Dashboard data fetch failed:", err)
    error = "Failed to load dashboard data. Please check your proxy route and API connection."
  }

  return (
    <DashboardContent
      leads={leads}
      messages={messages}
      workflowLogs={workflowLogs}
      stageHistory={stageHistory}
      vehicleMatches={vehicleMatches}
      error={error}
    />
  )
}