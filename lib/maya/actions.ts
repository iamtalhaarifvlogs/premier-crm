import { Lead } from "./types";
import { emitEvent } from "./events";

const API = "/api/leads";

/*
|--------------------------------------------------------------------------
| SAFE RESPONSE TYPE
|--------------------------------------------------------------------------
*/

type ActionResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

/*
|--------------------------------------------------------------------------
| CREATE LEAD
|--------------------------------------------------------------------------
*/

export async function createLead(
  item: Partial<Lead>
): Promise<ActionResponse> {
  try {
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

    const data = await res.json();

    if (data.success !== false) {
      await emitEvent("lead_created", payload.Item);

      return {
        success: true,
        data: payload.Item,
      };
    }

    return {
      success: false,
      error: "Failed to create lead",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE LEAD
|--------------------------------------------------------------------------
*/

export async function updateLead(
  lead: Lead,
  updates: Partial<Lead>
): Promise<ActionResponse> {
  try {
    const payload = {
      TableName: "tbl_leads",
      Item: {
        ...lead,
        ...updates,

        lead_id: lead.lead_id || lead.id,
        lastActivity: "Just now",
      },
    };

    const res = await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success !== false) {
      await emitEvent("lead_updated", payload.Item);

      return {
        success: true,
        data: payload.Item,
      };
    }

    return {
      success: false,
      error: "Failed to update lead",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/*
|--------------------------------------------------------------------------
| DELETE LEAD
|--------------------------------------------------------------------------
*/

export async function deleteLead(
  lead: Lead
): Promise<ActionResponse> {
  try {
    const leadId = lead.lead_id || lead.id;

    const res = await fetch(API, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        TableName: "tbl_leads",
        lead_id: leadId,
      }),
    });

    const data = await res.json();

    if (data.success !== false) {
      await emitEvent("lead_deleted", {
        lead_id: leadId,
        name: lead.name,
      });

      return {
        success: true,
      };
    }

    return {
      success: false,
      error: "Failed to delete lead",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}