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

  if (intent.intent === "show_all_leads") {
    if (leads.length === 0) {
      return {
        reply: "No leads found in the CRM.",
      }
    }

    const formatted = leads
      .map(
        (lead) =>
          `• ${lead.name} — ${lead.preferredVehicle} — ${lead.stage}`
      )
      .join("\n")

    return {
      reply: `Current CRM leads:\n\n${formatted}`,
    }
  }

  if (intent.intent === "show_hot_leads") {
    const hotLeads = leads.filter((lead) =>
      lead.statuses.includes("hot")
    )

    if (hotLeads.length === 0) {
      return {
        reply: "No hot leads found.",
      }
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

  const matchedLead = leads.find((lead) =>
    message.toLowerCase().includes(lead.name.toLowerCase())
  )

  const workflowResult = await processWorkflow(
    intent.intent,
    matchedLead
  )

  if (workflowResult) {
    return {
      reply: workflowResult.message,
    }
  }

  if (matchedLead) {
    return {
      reply:
        `${matchedLead.name}\n\n` +
        `Stage: ${matchedLead.stage}\n` +
        `Vehicle: ${matchedLead.preferredVehicle}\n` +
        `Budget: $${matchedLead.budget}\n` +
        `Location: ${matchedLead.location}\n` +
        `Credit: ${matchedLead.creditStatus}`,
    }
  }

  if (intent.intent === "pipeline_summary") {
    const summary: Record<string, number> = {}

    leads.forEach((lead) => {
      summary[lead.stage] = (summary[lead.stage] || 0) + 1
    })

    const formatted = Object.entries(summary)
      .map(([stage, count]) => `${stage}: ${count}`)
      .join("\n")

    return {
      reply: `Pipeline Summary\n\n${formatted}`,
    }
  }

  return {
    reply:
      "I understood your message but no matching operational action was found yet.",
  }
}
