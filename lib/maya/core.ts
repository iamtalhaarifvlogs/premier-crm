import { processWorkflow } from "./workflow-engine";
import { Lead } from "./types";

export async function runMayaCore(
  intent: string,
  leads: Lead[],
  input: string
) {
  const lead =
    leads.find((l) =>
      input.toLowerCase().includes(l.name.toLowerCase())
    ) || null;

  const result = await processWorkflow(
    intent,
    lead,
    {
      message: input,
      lead,
    }
  );

  return result;
}