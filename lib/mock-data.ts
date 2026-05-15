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

/* =============================================
   DIRECT AWS FETCH - CLEAN VERSION
   ============================================= */
const AWS_API = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data"

async function fetchTable(tableName: string) {
  const url = `\( {AWS_API}?TableName= \){tableName}`;
  console.log("Fetching URL:", url);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`AWS Error ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.Items || [];
}

/* =============================================
   MAIN FUNCTION
   ============================================= */

export async function getLeads() {
  const rawLeads = await fetchTable("tbl_leads");

  return rawLeads.map((lead: any, index: number) => ({
    id: lead.id || lead.lead_id || lead.leadId || `lead-${index}`,
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
  }));
}

// Minimal other functions
export async function getMessages() { return {}; }
export async function getWorkflowLogs() { return []; }
export async function getStageHistory() { return {}; }
export async function getVehicleMatches() { return []; }
export async function getScheduledJobs() { return []; }

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function getStatusColor() { return "bg-muted text-muted-foreground"; }
export function getStatusLabel(status: string) { return status; }