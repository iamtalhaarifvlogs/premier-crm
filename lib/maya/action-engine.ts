import { Lead } from "./types";

const API = "/api/leads";

/*
|--------------------------------------------------------------------------
| CREATE LEAD
|--------------------------------------------------------------------------
*/

export async function createLead(item: Partial<Lead>) {
  const lead_id = `lead-${Date.now()}`;

  const payload = {
    TableName: "tbl_leads",
    Item: {
      lead_id,
      id: lead_id,

      name: item.name || "",
      phone: item.phone || "",
      email: item.email || "",

      budget: item.budget || 0,
      preferredVehicle: item.preferredVehicle || "Unknown",

      stage: "new_lead",
      statuses: [],

      assignedRep: null,
      lastActivity: "Just now",

      downPayment: 0,
      location: item.location || "Unknown",

      creditStatus: item.creditStatus || "good",
      timeline: item.timeline || "Within 2 weeks",

      createdAt: new Date().toISOString(),
    },
  };

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

/*
|--------------------------------------------------------------------------
| UPDATE LEAD
|--------------------------------------------------------------------------
*/

export async function updateLead(lead: Lead, updates: Partial<Lead>) {
  const payload = {
    TableName: "tbl_leads",
    Item: {
      ...lead,
      ...updates,
      lead_id: lead.lead_id || lead.id,
    },
  };

  const res = await fetch(API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

/*
|--------------------------------------------------------------------------
| DELETE LEAD
|--------------------------------------------------------------------------
*/

export async function deleteLead(lead: Lead) {
  const res = await fetch(API, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      TableName: "tbl_leads",
      lead_id: lead.lead_id || lead.id,
    }),
  });

  return res.json();
}