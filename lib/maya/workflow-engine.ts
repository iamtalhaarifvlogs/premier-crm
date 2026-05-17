import { Lead } from "./types";
import { updateLead } from "./action-engine";

export type WorkflowInput = {
  intent: string;
  lead?: Lead | null;
  input?: any;
};

export type WorkflowResult = {
  success: boolean;
  message: string;
};

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
  if (!intent) return null;

  /*
  |--------------------------------------------------------------------------
  | PRICE OBJECTION
  |--------------------------------------------------------------------------
  */

  if (intent === "price_objection" && lead) {
    await updateLead(lead, {
      statuses: [...(lead.statuses || []), "objection"],
      lastActivity: "Price objection recorded",
    });

    return {
      success: true,
      message: `${lead.name}'s price objection has been recorded.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | QUALIFY LEAD
  |--------------------------------------------------------------------------
  */

  if (intent === "qualify_lead" && lead) {
    await updateLead(lead, {
      stage: "qualified",
      lastActivity: "Lead qualified by Maya",
    });

    return {
      success: true,
      message: `${lead.name} has been qualified successfully.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | MOVE TO SOURCING
  |--------------------------------------------------------------------------
  */

  if (intent === "move_to_sourcing" && lead) {
    await updateLead(lead, {
      stage: "vehicle_sourcing",
      lastActivity: "Moved to sourcing",
    });

    return {
      success: true,
      message: `${lead.name} moved to Vehicle Sourcing.`,
    };
  }

  return null;
}