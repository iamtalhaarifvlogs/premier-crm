import { Lead } from "@/lib/mock-data"
import { detectIntent } from "./intent-parser"
import { processWorkflow } from "./workflow-engine"

export interface MayaResponse {
  reply: string
  actions?: string[]
}

export async function processMayaMessage(
  message: string,
  leads: Lead[]
): Promise<MayaResponse> {
  const intent = detectIntent(message)

  /*
  |--------------------------------------------------------------------------
  | SHOW ALL LEADS
  |--------------------------------------------------------------------------
  */
  if (intent.intent === "show_all_leads") {
    if (leads.length === 0) {
      return { reply: "No leads found in the CRM." }
    }

    return {
      reply:
        "Current CRM leads:\n\n" +
        leads
          .map(
            (lead) =>
              `• ${lead.name} — ${lead.preferredVehicle} — ${lead.stage}`
          )
          .join("\n"),
    }
  }

  /*
  |--------------------------------------------------------------------------
  | HOT LEADS
  |--------------------------------------------------------------------------
  */
  if (intent.intent === "show_hot_leads") {
    const hotLeads = leads.filter((lead) =>
      lead.statuses.includes("hot")
    )

    if (!hotLeads.length) {
      return { reply: "No hot leads found." }
    }

    return {
      reply: hotLeads
        .map(
          (lead) =>
            `🔥 ${lead.name} — ${lead.preferredVehicle}`
        )
        .join("\n"),
    }
  }

  /*
  |--------------------------------------------------------------------------
  | MATCH LEAD
  |--------------------------------------------------------------------------
  */
  const matchedLead: Lead | null =
  leads.find((lead) =>
    message.toLowerCase().includes(lead.name.toLowerCase())
  ) || null

  /*
  |--------------------------------------------------------------------------
  | WORKFLOW ENGINE (FIXED HERE ✅)
  |--------------------------------------------------------------------------
  */
  const workflowResult = await processWorkflow(
    intent.intent,
    matchedLead,
    message // ✅ THIS WAS MISSING
  )

  if (workflowResult) {
    return {
      reply: workflowResult.message,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LEAD DETAILS
  |--------------------------------------------------------------------------
  */
  if (matchedLead) {
    return {
      reply: `
${matchedLead.name}

Stage: ${matchedLead.stage}
Vehicle: ${matchedLead.preferredVehicle}
Budget: $${matchedLead.budget}
Location: ${matchedLead.location}
Credit: ${matchedLead.creditStatus}
      `.trim(),
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PIPELINE SUMMARY
  |--------------------------------------------------------------------------
  */
  if (intent.intent === "pipeline_summary") {
    const summary: Record<string, number> = {}

    leads.forEach((lead) => {
      summary[lead.stage] = (summary[lead.stage] || 0) + 1
    })

    return {
      reply:
        "Pipeline Summary\n\n" +
        Object.entries(summary)
          .map(([stage, count]) => `${stage}: ${count}`)
          .join("\n"),
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FALLBACK
  |--------------------------------------------------------------------------
  */
  return {
    reply:
      "I understood your message but no matching operational action was found yet.",
  }
}