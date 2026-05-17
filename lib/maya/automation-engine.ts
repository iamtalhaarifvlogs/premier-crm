import { Lead } from "./types"
import { processWorkflow } from "./workflow-engine"

export async function runAutomation(
  leads: Lead[]
) {
  for (const lead of leads) {
    const lastActivity = lead.lastActivity || ""

    if (
      lead.stage === "vehicle_sourcing" &&
      lastActivity.includes("3 days")
    ) {
      await processWorkflow(
        "rep_handoff",
        lead,
        "Automatic follow-up escalation"
      )
    }

    if (
      lead.budget >= 50000 &&
      lead.creditStatus === "excellent"
    ) {
      await processWorkflow(
        "qualify_lead",
        lead,
        "High-value lead detected"
      )
    }
  }
}
