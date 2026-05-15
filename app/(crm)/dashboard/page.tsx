// app/(CRM)/dashboard/page.tsx
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { getLeads } from "@/lib/mock-data"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  let leads: any[] = []
  let error: string | null = null

  try {
    leads = await getLeads()
  } catch (err: any) {
    console.error("Full Dashboard Error:", err)
    error = `Failed to load data: ${err.message}`
  }

  return <DashboardContent leads={leads} error={error} />
}