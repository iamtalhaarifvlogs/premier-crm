import { Lead } from "./types";
import { detectIntent } from "./intent-parser";
import { processWorkflow } from "./workflow-engine";

export interface MayaResponse {
  reply: string;
  actions?: string[];
}

export async function processMayaMessage(
  message: string,
  leads: Lead[]
): Promise<MayaResponse> {
  const intent = detectIntent(message);

  /*
  |--------------------------------------------------------------------------
  | SIMPLE LISTING
  |--------------------------------------------------------------------------
  */

  if (intent.intent === "show_all_leads") {
    if (!leads.length) {
      return { reply: "No leads found in the CRM." };
    }

    return {
      reply: leads
        .map(
          (l) =>
            `• ${l.name} — ${l.preferredVehicle} — ${l.stage}`
        )
        .join("\n"),
    };
  }

  /*
  |--------------------------------------------------------------------------
  | HOT LEADS
  |--------------------------------------------------------------------------
  */

  if (intent.intent === "show_hot_leads") {
    const hot = leads.filter((l) =>
      l.statuses?.includes("hot")
    );

    return {
      reply:
        hot.length > 0
          ? hot
              .map((l) => `🔥 ${l.name} — ${l.preferredVehicle}`)
              .join("\n")
          : "No hot leads found.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | MATCH LEAD
  |--------------------------------------------------------------------------
  */

  const matchedLead =
    leads.find((l) =>
      message.toLowerCase().includes(l.name.toLowerCase())
    ) || null;

  /*
  |--------------------------------------------------------------------------
  | WORKFLOW EXECUTION (FIXED)
  |--------------------------------------------------------------------------
  */

  const workflowResult = await processWorkflow(
    intent.intent,
    matchedLead,
    intent.input || null
  );

  if (workflowResult?.message) {
    return {
      reply: workflowResult.message,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SHOW SINGLE LEAD
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
    };
  }

  /*
  |--------------------------------------------------------------------------
  | PIPELINE SUMMARY
  |--------------------------------------------------------------------------
  */

  if (intent.intent === "pipeline_summary") {
    const summary: Record<string, number> = {};

    leads.forEach((l) => {
      summary[l.stage] = (summary[l.stage] || 0) + 1;
    });

    return {
      reply: Object.entries(summary)
        .map(([stage, count]) => `${stage}: ${count}`)
        .join("\n"),
    };
  }

  /*
  |--------------------------------------------------------------------------
  | FALLBACK
  |--------------------------------------------------------------------------
  */

  return {
    reply:
      "I understood your message but no matching CRM action was found.",
  };
}