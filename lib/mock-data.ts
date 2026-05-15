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
const AWS_API = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data"

async function fetchTable(tableName: string): Promise<any[]> {
  const url = `\( {AWS_API}?TableName= \){tableName}`;
  console.log("Fetching:", url);

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`AWS ${res.status}`);

  const data = await res.json();
  return Array.isArray(data) ? data : data.Items || [];
}

/*
|--------------------------------------------------------------------------
| MAIN FUNCTIONS
|--------------------------------------------------------------------------
*/

export async function getLeads() {
  const raw = await fetchTable("tbl_leads");
  return raw.map((lead: any, i: number) => ({
    id: lead.id || lead.lead_id || `lead-${i}`,
    name: lead.name || "Unknown",
    phone: lead.phone || "",
    email: lead.email || "",
    budget: Number(lead.budget || 0),
    preferredVehicle: lead.preferredVehicle || "Unknown Vehicle",
    stage: lead.stage || "new_lead",
    statuses: Array.isArray(lead.statuses) ? lead.statuses : [],
    assignedRep: lead.assignedRep || null,
    lastActivity: lead.lastActivity || "N/A",
    downPayment: Number(lead.downPayment || 0),
    location: lead.location || "Unknown",
    creditStatus: lead.creditStatus || "good",
    timeline: lead.timeline || "Unknown",
    createdAt: lead.createdAt || new Date().toISOString(),
  }));
}

export async function getMessages() { return {}; }
export async function getWorkflowLogs() { return []; }
export async function getStageHistory() { return {}; }
export async function getVehicleMatches() { return []; }
export async function getScheduledJobs() { return []; }

/*
|--------------------------------------------------------------------------
| HELPERS (Required by other components)
|--------------------------------------------------------------------------
*/

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function getLeadsByStage(leads: Lead[], stage: PipelineStage): Lead[] {
  return leads.filter((lead) => lead.stage === stage);
}

export function getStatusColor(status: LeadStatus): string {
  switch (status) {
    case "hot": return "bg-orange-100 text-orange-700 border-orange-200";
    case "automation_paused": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "customer_replied": return "bg-green-100 text-green-700 border-green-200";
    case "deposit_paid": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "bg-muted text-muted-foreground";
  }
}

export function getStatusLabel(status: LeadStatus): string {
  switch (status) {
    case "hot": return "Hot Lead";
    case "automation_paused": return "Automation Paused";
    case "customer_replied": return "Customer Replied";
    case "deposit_paid": return "Deposit Paid";
    default: return status;
  }
}

/*
|--------------------------------------------------------------------------
| MOCKS (Required by crm-context.tsx and other files)
|--------------------------------------------------------------------------
*/
export const mockLeads: Lead[] = [];
export const mockMessages: Record<string, Message[]> = {};
export const mockWorkflowLogs: WorkflowLog[] = [];
export const mockStageHistory: Record<string, StageHistoryItem[]> = {};
export const mockVehicleMatches: VehicleMatch[] = [];
export const mockScheduledJobs: ScheduledJob[] = [];