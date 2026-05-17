import { Lead } from "./types";
import { processWorkflow } from "./workflow-engine";

export async function runMayaEngine(
  intent: string,
  lead: Lead | null,
  input: string
) {
  const result = await processWorkflow(intent, lead, {
    message: input,
    lead,
  });

  return {
    success: result.success,
    message: result.message,
    updatedLead: result.updatedLead || null,
  };
}