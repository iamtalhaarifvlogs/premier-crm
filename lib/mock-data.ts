// lib/mock-data.ts

export type LeadStatus =
  | "hot"
  | "automation_paused"
  | "customer_replied"
  | "deposit_paid"

export type PipelineStage =
  | "new_lead"
  | "maya_qualification"
  | "vehicle_sourcing"
  | "alternatives_presented"
  | "deposit_requested"
  | "deposit_paid"
  | "rep_handoff"
  | "closed_won"
  | "closed_lost"

export const PIPELINE_STAGES: { id: PipelineStage; name: string }[] = [
  { id: "new_lead", name: "New Lead" },
  { id: "maya_qualification", name: "Maya Qualification" },
  { id: "vehicle_sourcing", name: "Vehicle Sourcing" },
  { id: "alternatives_presented", name: "Alternatives Presented" },
  { id: "deposit_requested", name: "Deposit Requested" },
  { id: "deposit_paid", name: "Deposit Paid" },
  { id: "rep_handoff", name: "Rep Handoff" },
  { id: "closed_won", name: "Closed Won" },
  { id: "closed_lost", name: "Closed Lost" },
]

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  budget: number
  preferredVehicle: string
  stage: PipelineStage
  statuses: LeadStatus[]
  assignedRep: string | null
  lastActivity: string
  downPayment: number
  location: string
  creditStatus: "excellent" | "good" | "fair" | "poor"
  timeline: string
  createdAt: string
}

export interface Message {
  id: string
  leadId: string
  sender: "customer" | "maya" | "rep" | "system"
  content: string
  timestamp: string
}

export interface WorkflowLog {
  id: string
  leadId: string
  timestamp: string
  workflowName: string
  triggerEvent: string
  action: string
  status: "success" | "skipped" | "failed"
  metadata: string
}

export interface StageHistoryItem {
  stage: PipelineStage
  timestamp: string
  note?: string
}

export interface VehicleMatch {
  id: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  color: string
  dealership: string
  matchScore: number
}

export interface ScheduledJob {
  id: string
  leadId: string
  runAt: string
  jobType: string
  status: "pending" | "completed" | "cancelled"
}

/* =============================================
   DIRECT AWS FETCH
   ============================================= */

async function fetchTable(tableName: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data?TableName=${tableName}`,
      {
        method: "GET",
        cache: "no-store",
        next: { revalidate: 0 },
      }
    )

    if (!response.ok) {
      throw new Error(`AWS Error ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.Items || []
  } catch (error: any) {
    console.error(`[fetchTable] Failed for ${tableName}:`, error.message)
    throw error
  }
}

/*
|--------------------------------------------------------------------------
| MAIN DATA FETCHERS
|--------------------------------------------------------------------------
*/

export async function getLeads(): Promise<Lead[]> {
  const raw = await fetchTable("tbl_leads")
  return raw.map((lead: any, index: number) => ({
    id: lead.id || lead.lead_id || `lead-${index}`,
    name: lead.name || "Unknown",
    phone: lead.phone || "",
    email: lead.email || "",
    budget: Number(lead.budget || 0),
    preferredVehicle: lead.preferredVehicle || lead.preferred_vehicle || "Unknown Vehicle",
    stage: (lead.stage || "new_lead") as PipelineStage,
    statuses: Array.isArray(lead.statuses) ? lead.statuses : [],
    assignedRep: lead.assignedRep || null,
    lastActivity: lead.lastActivity || lead.last_activity || "N/A",
    downPayment: Number(lead.downPayment || lead.down_payment || 0),
    location: lead.location || "Unknown",
    creditStatus: lead.creditStatus || lead.credit_status || "good",
    timeline: lead.timeline || "Unknown",
    createdAt: lead.createdAt || lead.created_at || new Date().toISOString(),
  }))
}

export async function getMessages(): Promise<Record<string, Message[]>> {
  const messages = await fetchTable("tbl_messages")
  const grouped: Record<string, Message[]> = {}

  messages.forEach((message: any) => {
    const leadId = message.leadId || message.lead_id || message.leadId
    if (!leadId) return
    if (!grouped[leadId]) grouped[leadId] = []
    grouped[leadId].push({
      id: message.id || message.message_id || `msg-${Date.now()}`,
      leadId,
      sender: message.sender || "customer",
      content: message.content || "",
      timestamp: message.timestamp || new Date().toISOString(),
    })
  })
  return grouped
}

export async function getWorkflowLogs(): Promise<WorkflowLog[]> {
  return fetchTable("tbl_workflow_logs")
}

export async function getStageHistory(): Promise<Record<string, StageHistoryItem[]>> {
  const items = await fetchTable("tbl_stage_history")
  const grouped: Record<string, StageHistoryItem[]> = {}

  items.forEach((item: any) => {
    const leadId = item.leadId || item.lead_id || item.leadId
    if (!leadId) return
    if (!grouped[leadId]) grouped[leadId] = []
    grouped[leadId].push({
      stage: item.stage,
      timestamp: item.timestamp,
      note: item.note,
    })
  })
  return grouped
}

export async function getVehicleMatches(): Promise<VehicleMatch[]> {
  return fetchTable("tbl_vehicle_matches")
}

export async function getScheduledJobs(): Promise<ScheduledJob[]> {
  return fetchTable("tbl_scheduled_jobs")
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function getLeadsByStage(leads: Lead[], stage: PipelineStage): Lead[] {
  return leads.filter((lead) => lead.stage === stage)
}

export function getStatusColor(status: LeadStatus): string {
  switch (status) {
    case "hot": return "bg-orange-100 text-orange-700 border-orange-200"
    case "automation_paused": return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case "customer_replied": return "bg-green-100 text-green-700 border-green-200"
    case "deposit_paid": return "bg-blue-100 text-blue-700 border-blue-200"
    default: return "bg-muted text-muted-foreground"
  }
}

export function getStatusLabel(status: LeadStatus): string {
  switch (status) {
    case "hot": return "Hot Lead"
    case "automation_paused": return "Automation Paused"
    case "customer_replied": return "Customer Replied"
    case "deposit_paid": return "Deposit Paid"
    default: return status
  }
}

/* Mocks for compatibility */
export const mockLeads: Lead[] = []
export const mockMessages: Record<string, Message[]> = {}
export const mockWorkflowLogs: WorkflowLog[] = []
export const mockStageHistory: Record<string, StageHistoryItem[]> = {}
export const mockVehicleMatches: VehicleMatch[] = []
export const mockScheduledJobs: ScheduledJob[] = []