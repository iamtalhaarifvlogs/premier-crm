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
   PROXY CONFIGURATION
   ============================================= */
const API_BASE = "/api/crm"

async function fetchTable<T>(tableName: string): Promise<any[]> {
  try {
    console.log(`[fetchTable] Fetching ${tableName}...`)

    const response = await fetch(
      `\( {API_BASE}/ \){tableName}`,
      {
        method: "GET",
        cache: "no-store",
        next: { revalidate: 0 },
        headers: { "Content-Type": "application/json" },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    return Array.isArray(data) ? data : data.Items || []
  } catch (error: any) {
    console.error(`[fetchTable] Error for ${tableName}:`, error.message)
    throw error
  }
}

/*
|--------------------------------------------------------------------------
| MAIN FUNCTIONS
|--------------------------------------------------------------------------
*/

export async function getLeads(): Promise<Lead[]> {
  const raw = await fetchTable("tbl_leads")
  return raw.map((lead: any, i: number) => ({
    id: lead.id || lead.lead_id || lead.leadId || `lead-${i}`,
    name: lead.name || "Unknown",
    phone: lead.phone || "",
    email: lead.email || "",
    budget: Number(lead.budget || 0),
    preferredVehicle: lead.preferredVehicle || lead.preferred_vehicle || "Unknown Vehicle",
    stage: (lead.stage || "new_lead") as PipelineStage,
    statuses: Array.isArray(lead.statuses) ? lead.statuses : [],
    assignedRep: lead.assignedRep || null,
    lastActivity: lead.lastActivity || "N/A",
    downPayment: Number(lead.downPayment || 0),
    location: lead.location || "Unknown",
    creditStatus: lead.creditStatus || "good",
    timeline: lead.timeline || "Unknown",
    createdAt: lead.createdAt || lead.created_at || new Date().toISOString(),
  }))
}

export async function getMessages() { 
  const data = await fetchTable("tbl_messages")
  return data
}

export async function getWorkflowLogs() { return fetchTable("tbl_workflow_logs") }
export async function getStageHistory() { return fetchTable("tbl_stage_history") }
export async function getVehicleMatches() { return fetchTable("tbl_vehicle_matches") }
export async function getScheduledJobs() { return fetchTable("tbl_scheduled_jobs") }

/* Helpers */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

export function getLeadsByStage(leads: Lead[], stage: PipelineStage): Lead[] {
  return leads.filter(l => l.stage === stage)
}

export function getStatusColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    hot: "bg-orange-100 text-orange-700 border-orange-200",
    automation_paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
    customer_replied: "bg-green-100 text-green-700 border-green-200",
    deposit_paid: "bg-blue-100 text-blue-700 border-blue-200",
  }
  return colors[status] || "bg-muted text-muted-foreground"
}

export function getStatusLabel(status: LeadStatus): string {
  const labels: Record<LeadStatus, string> = {
    hot: "Hot Lead",
    automation_paused: "Automation Paused",
    customer_replied: "Customer Replied",
    deposit_paid: "Deposit Paid",
  }
  return labels[status] || status
}

// Mocks
export const mockLeads: Lead[] = []
export const mockMessages: Record<string, Message[]> = {}
export const mockWorkflowLogs: WorkflowLog[] = []
export const mockStageHistory: Record<string, StageHistoryItem[]> = {}
export const mockVehicleMatches: VehicleMatch[] = []
export const mockScheduledJobs: ScheduledJob[] = []