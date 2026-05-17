import { Lead } from "./types"
import { updateLead } from "./action-engine"
import { createTimelineEvent } from "./timeline"
import { saveMemory } from "./memory"

export type WorkflowResult = {
  success: boolean
  message: string
  updatedLead?: Lead
}

/*
|--------------------------------------------------------------------------
| MAIN WORKFLOW ENTRY
|--------------------------------------------------------------------------
*/

export async function processWorkflow(
  intent: string,
  lead: Lead | null,
  input: any
): Promise<WorkflowResult | null> {
  if (!intent || !lead) {
    return null
  }

  /*
  |--------------------------------------------------------------------------
  | SAFE LEAD ID
  |--------------------------------------------------------------------------
  */

  const leadId = lead.lead_id || lead.id

  if (!leadId) {
    return {
      success: false,
      message: "Lead ID is missing.",
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SAFE STATUSES
  |--------------------------------------------------------------------------
  */

  const safeStatuses = Array.isArray(lead.statuses)
    ? lead.statuses
    : []

  /*
  |--------------------------------------------------------------------------
  | PRICE OBJECTION
  |--------------------------------------------------------------------------
  */

  if (intent === "price_objection") {
    const updated = await updateLead(lead, {
      statuses: [...safeStatuses, "price_objection"],
      lastActivity: "Price objection recorded",
    })

    await createTimelineEvent({
      lead_id: leadId,
      type: "objection",
      message: `${lead.name} raised a price objection.`,
      createdAt: new Date().toISOString(),
    })

    await saveMemory({
      lead_id: leadId,
      context_type: "objection",
      content: input || "Price objection detected",
    })

    return {
      success: true,
      message: `${lead.name}'s price objection has been recorded.`,
      updatedLead: updated?.Item || undefined,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | QUALIFY LEAD
  |--------------------------------------------------------------------------
  */

  if (intent === "qualify_lead") {
    const updated = await updateLead(lead, {
      stage: "qualified",
      statuses: [...safeStatuses, "qualified"],
      lastActivity: "Lead qualified by Maya",
    })

    await createTimelineEvent({
      lead_id: leadId,
      type: "qualification",
      message: `${lead.name} was qualified by Maya.`,
      createdAt: new Date().toISOString(),
    })

    await saveMemory({
      lead_id: leadId,
      context_type: "qualification",
      content: "Lead qualified successfully",
    })

    return {
      success: true,
      message: `${lead.name} has been qualified successfully.`,
      updatedLead: updated?.Item || undefined,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | MOVE TO SOURCING
  |--------------------------------------------------------------------------
  */

  if (intent === "move_to_sourcing") {
    const updated = await updateLead(lead, {
      stage: "vehicle_sourcing",
      statuses: [...safeStatuses, "sourcing"],
      lastActivity: "Moved to sourcing",
    })

    await createTimelineEvent({
      lead_id: leadId,
      type: "stage_change",
      message: `${lead.name} moved to Vehicle Sourcing.`,
      createdAt: new Date().toISOString(),
    })

    await saveMemory({
      lead_id: leadId,
      context_type: "workflow",
      content: "Lead moved into sourcing stage",
    })

    return {
      success: true,
      message: `${lead.name} moved to Vehicle Sourcing.`,
      updatedLead: updated?.Item || undefined,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DEPOSIT PAID
  |--------------------------------------------------------------------------
  */

  if (intent === "deposit_paid") {
    const updated = await updateLead(lead, {
      stage: "closed_won",
      statuses: [...safeStatuses, "deposit_paid"],
      lastActivity: "Deposit marked as paid",
    })

    await createTimelineEvent({
      lead_id: leadId,
      type: "deposit",
      message: `${lead.name} completed deposit payment.`,
      createdAt: new Date().toISOString(),
    })

    await saveMemory({
      lead_id: leadId,
      context_type: "deposit",
      content: "Deposit payment confirmed",
    })

    return {
      success: true,
      message: `${lead.name}'s deposit has been marked as paid.`,
      updatedLead: updated?.Item || undefined,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | REP HANDOFF
  |--------------------------------------------------------------------------
  */

  if (intent === "rep_handoff") {
    const updated = await updateLead(lead, {
      statuses: [...safeStatuses, "rep_handoff"],
      lastActivity: "Handed off to sales rep",
    })

    await createTimelineEvent({
      lead_id: leadId,
      type: "rep_handoff",
      message: `${lead.name} was handed off to sales rep.`,
      createdAt: new Date().toISOString(),
    })

    await saveMemory({
      lead_id: leadId,
      context_type: "handoff",
      content: "Lead assigned to sales representative",
    })

    return {
      success: true,
      message: `${lead.name} has been handed over to a sales rep.`,
      updatedLead: updated?.Item || undefined,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DEFAULT
  |--------------------------------------------------------------------------
  */

  return {
    success: false,
    message: "No workflow action matched this intent.",
  }
}