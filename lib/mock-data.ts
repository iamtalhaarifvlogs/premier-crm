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

export const PIPELINE_STAGES = [
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
  creditStatus: string
  timeline: string
  createdAt: string
}

const AWS_API = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data"

async function fetchTable(tableName: string) {
  const url = `\( {AWS_API}?TableName= \){tableName}`;
  console.log("→ Fetching:", url);

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`AWS ${res.status}`);

  const data = await res.json();
  return Array.isArray(data) ? data : data.Items || [];
}

export async function getLeads() {
  const raw = await fetchTable("tbl_leads");
  return raw.map((l: any, i: number) => ({
    id: l.id || l.lead_id || `lead-${i}`,
    name: l.name || "Unknown",
    phone: l.phone || "",
    email: l.email || "",
    budget: Number(l.budget || 0),
    preferredVehicle: l.preferredVehicle || "Unknown",
    stage: l.stage || "new_lead",
    statuses: Array.isArray(l.statuses) ? l.statuses : [],
    assignedRep: l.assignedRep || null,
    lastActivity: l.lastActivity || "N/A",
    downPayment: Number(l.downPayment || 0),
    location: l.location || "Unknown",
    creditStatus: l.creditStatus || "good",
    timeline: l.timeline || "Unknown",
    createdAt: l.createdAt || new Date().toISOString(),
  }));
}

// Minimal other functions
export async function getMessages() { return {}; }
export async function getWorkflowLogs() { return []; }
export async function getStageHistory() { return {}; }
export async function getVehicleMatches() { return []; }
export async function getScheduledJobs() { return []; }

export function formatCurrency(n: number) {
  return "$" + n.toLocaleString();
}