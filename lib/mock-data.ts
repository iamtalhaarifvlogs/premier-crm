// lib/mock-data.ts

const AWS_API = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data"

async function fetchTable(tableName: string) {
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

// Stubs for other functions
export async function getMessages() { return {}; }
export async function getWorkflowLogs() { return []; }
export async function getStageHistory() { return {}; }
export async function getVehicleMatches() { return []; }
export async function getScheduledJobs() { return []; }

export function formatCurrency(amount: number) {
  return "$" + Number(amount).toLocaleString();
}