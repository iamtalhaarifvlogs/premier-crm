import { Lead } from "./types";

export type WorkflowInput = {
  message: string;
  lead: Lead | null;
};

export type WorkflowResult = {
  success: boolean;
  message: string;
  updatedLead?: Lead | null;
};

export async function processWorkflow(
  intent: string,
  lead: Lead | null,
  input: WorkflowInput
): Promise<WorkflowResult> {
  const msg = input.message.toLowerCase();

  if (!lead && intent !== "pipeline_summary") {
    return {
      success: false,
      message: "No lead context found.",
    };
  }

  switch (intent) {
    case "show_lead":
      return {
        success: true,
        message: `${lead?.name}
Stage: ${lead?.stage}
Vehicle: ${lead?.preferredVehicle}
Budget: ${lead?.budget}`,
      };

    case "qualify_lead":
      return {
        success: true,
        message: `${lead?.name} marked as qualified.`,
        updatedLead: lead
          ? {
              ...lead,
              stage: "qualified",
              statuses: [...lead.statuses, "qualified"],
            }
          : null,
      };

    case "price_objection":
      return {
        success: true,
        message: `Price objection logged for ${lead?.name}.`,
      };

    case "add_note":
      return {
        success: true,
        message: `Note added to ${lead?.name}.`,
      };

    default:
      return {
        success: false,
        message: "No workflow matched for this intent.",
      };
  }
}