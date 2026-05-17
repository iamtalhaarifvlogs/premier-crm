// app/api/maya/route.ts

import { NextRequest, NextResponse } from "next/server";

const AWS_API =
  "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data";

async function getLeads() {
  const response = await fetch(`${AWS_API}?TableName=tbl_leads`, {
    cache: "no-store",
  });

  const data = await response.json();

  return data.Items || [];
}

async function createLead(item: any) {
  return fetch(AWS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      TableName: "tbl_leads",
      Item: item,
    }),
  });
}

async function updateLead(item: any) {
  return fetch(AWS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      TableName: "tbl_leads",
      Item: item,
    }),
  });
}

async function deleteLead(lead_id: string) {
  return fetch(AWS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      TableName: "tbl_leads",
      Key: {
        lead_id,
      },
      Action: "DELETE",
    }),
  });
}

async function addWorkflowLog(log: any) {
  return fetch(AWS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      TableName: "tbl_workflow_logs",
      Item: log,
    }),
  });
}

async function saveMemory(
  lead_id: string,
  context_type: string,
  content: any
) {
  return fetch(AWS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      TableName: "tbl_maya",
      Item: {
        lead_id,
        context_type,
        content,
        updatedAt: new Date().toISOString(),
      },
    }),
  });
}

function normalizeLead(lead: any) {
  return {
    id: lead.lead_id || lead.id,
    lead_id: lead.lead_id || lead.id,
    name: lead.name || "Unknown",
    phone: lead.phone || "",
    email: lead.email || "",
    budget: Number(lead.budget || 0),
    preferredVehicle: lead.preferredVehicle || "Not specified",
    stage: lead.stage || "new_lead",
    statuses: Array.isArray(lead.statuses)
      ? lead.statuses
      : [],
    assignedRep: lead.assignedRep || null,
    lastActivity: lead.lastActivity || "Just now",
    downPayment: Number(lead.downPayment || 0),
    location: lead.location || "Unknown",
    creditStatus: lead.creditStatus || "good",
    timeline: lead.timeline || "Unknown",
    createdAt:
      lead.createdAt || new Date().toISOString(),
  };
}

function createNaturalResponse(text: string) {
  const variations = [
    text,
    `${text}`,
    `${text} Let me know what you'd like to do next.`,
  ];

  return variations[
    Math.floor(Math.random() * variations.length)
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const message = body.message?.toLowerCase() || "";

    const leadsRaw = await getLeads();

    const leads = leadsRaw.map(normalizeLead);

    /*
    |--------------------------------------------------------------------------
    | SHOW ALL LEADS
    |--------------------------------------------------------------------------
    */

    if (
      message.includes("all leads") ||
      message.includes("show leads") ||
      message.includes("list leads")
    ) {
      return NextResponse.json({
        success: true,
        reply:
          leads.length === 0
            ? "No leads found."
            : leads
                .map(
                  (l: any) =>
                    `• ${l.name} — ${l.preferredVehicle} — $${l.budget} — ${l.stage}`
                )
                .join("\n"),
      });
    }

    /*
    |--------------------------------------------------------------------------
    | FIND LEAD
    |--------------------------------------------------------------------------
    */

    const matchedLead = leads.find((lead: any) =>
      message.includes(lead.name.toLowerCase())
    );

    /*
    |--------------------------------------------------------------------------
    | CREATE LEAD
    |--------------------------------------------------------------------------
    */

    if (
      message.includes("add lead") ||
      message.includes("create lead") ||
      message.includes("new lead")
    ) {
      const lead = {
        lead_id: `lead-${Date.now()}`,
        name: body.name || "Unknown",
        phone: body.phone || "",
        email: body.email || "",
        budget: Number(body.budget || 0),
        preferredVehicle:
          body.preferredVehicle || "Not specified",
        stage: "new_lead",
        statuses: [],
        assignedRep: null,
        lastActivity: "Just now",
        downPayment: 0,
        location: body.location || "Unknown",
        creditStatus: "good",
        timeline: "Within 2 weeks",
        createdAt: new Date().toISOString(),
      };

      await createLead(lead);

      await addWorkflowLog({
        id: `log-${Date.now()}`,
        leadId: lead.lead_id,
        timestamp: new Date().toISOString(),
        workflowName: "Lead Creation",
        triggerEvent: "Lead Added",
        action: `Lead ${lead.name} created`,
        status: "success",
        metadata: JSON.stringify(lead),
      });

      return NextResponse.json({
        success: true,
        reply: createNaturalResponse(
          `${lead.name} has been added successfully.`
        ),
      });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE LEAD
    |--------------------------------------------------------------------------
    */

    if (
      matchedLead &&
      (
        message.includes("delete") ||
        message.includes("remove")
      )
    ) {
      await deleteLead(matchedLead.lead_id);

      return NextResponse.json({
        success: true,
        reply: `${matchedLead.name} has been deleted.`,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | MOVE STAGE
    |--------------------------------------------------------------------------
    */

    if (
      matchedLead &&
      (
        message.includes("move") ||
        message.includes("stage")
      )
    ) {
      let newStage = matchedLead.stage;

      if (message.includes("sourcing")) {
        newStage = "vehicle_sourcing";
      }

      if (message.includes("qualification")) {
        newStage = "maya_qualification";
      }

      if (message.includes("deposit")) {
        newStage = "deposit_requested";
      }

      if (message.includes("paid")) {
        newStage = "deposit_paid";
      }

      const updated = {
        ...matchedLead,
        stage: newStage,
      };

      await updateLead(updated);

      await addWorkflowLog({
        id: `log-${Date.now()}`,
        leadId: matchedLead.lead_id,
        timestamp: new Date().toISOString(),
        workflowName: "Stage Movement",
        triggerEvent: "Pipeline Update",
        action: `${matchedLead.name} moved to ${newStage}`,
        status: "success",
        metadata: "",
      });

      return NextResponse.json({
        success: true,
        reply: `${matchedLead.name} has been moved to ${newStage}.`,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PRICE OBJECTION
    |--------------------------------------------------------------------------
    */

    if (
      matchedLead &&
      (
        message.includes("too expensive") ||
        message.includes("too high") ||
        message.includes("price")
      )
    ) {
      await saveMemory(
        matchedLead.lead_id,
        "price_objection",
        {
          note: "Customer objected to pricing",
        }
      );

      await addWorkflowLog({
        id: `log-${Date.now()}`,
        leadId: matchedLead.lead_id,
        timestamp: new Date().toISOString(),
        workflowName: "Objection Handling",
        triggerEvent: "Price Objection",
        action: "Customer raised pricing concern",
        status: "success",
        metadata: "",
      });

      return NextResponse.json({
        success: true,
        reply:
          `${matchedLead.name} raised a pricing objection. ` +
          `I've logged it and saved it into memory.`,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW LEAD DETAILS
    |--------------------------------------------------------------------------
    */

    if (matchedLead) {
      return NextResponse.json({
        success: true,
        reply: `
${matchedLead.name}

Vehicle: ${matchedLead.preferredVehicle}
Budget: $${matchedLead.budget}
Stage: ${matchedLead.stage}
Phone: ${matchedLead.phone}
Email: ${matchedLead.email}
Location: ${matchedLead.location}
Credit: ${matchedLead.creditStatus}
Timeline: ${matchedLead.timeline}
Statuses: ${
          matchedLead.statuses.join(", ") || "None"
        }
        `,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | FALLBACK
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success: true,
      reply:
        "I couldn't understand that request yet. Try asking:\n\n" +
        "• Show all leads\n" +
        "• Tell me about Talha\n" +
        "• Move Talha to sourcing\n" +
        "• Talha says the price is too high\n" +
        "• Delete Sarah Johnson",
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}