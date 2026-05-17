import { Lead } from "@/lib/mock-data"
import {
  createWorkflowLog,
  moveLeadStage,
} from "./actions"

export async function processWorkflow(
  intent: string,
  lead?: Lead
) {
  if (!lead) return null

  if (intent === "price_objection") {
    await moveLeadStage(lead, "vehicle_sourcing")

    await createWorkflowLog({
      lead_id: lead.id,
      timestamp: new Date().toISOString(),
      event_type: "price_objection",
      performed_by: "maya",
      message: `${lead.name} objected to pricing. Lead moved to sourcing.`,
    })

    return {
      success: true,
      message:
        `${lead.name} has been moved into vehicle sourcing. ` +
        `I also logged the pricing objection for the sales team.`,
    }
  }

  if (intent === "deposit_paid") {
    await moveLeadStage(lead, "deposit_paid")

    await createWorkflowLog({
      lead_id: lead.id,
      timestamp: new Date().toISOString(),
      event_type: "deposit_paid",
      performed_by: "maya",
      message: `Deposit marked as paid for ${lead.name}`,
    })

    return {
      success: true,
      message:
        `Deposit payment recorded for ${lead.name}. ` +
        `Lead has been moved into the deposit paid stage.`,
    }
  }

  return null
}
