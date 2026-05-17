import { PipelineStage } from "@/lib/mock-data";

export interface MayaIntent {
  intent: string;
  confidence: number;

  // 👇 IMPORTANT FIX: makes workflow engine safe
  input?: string;

  entities?: {
    leadName?: string;
    field?: string;
    value?: string;
    targetStage?: PipelineStage;
  };
}

/*
|--------------------------------------------------------------------------
| STAGE MAP (for future workflow automation)
|--------------------------------------------------------------------------
*/

const stageMap: Record<string, PipelineStage> = {
  sourcing: "vehicle_sourcing",
  qualification: "maya_qualification",
  deposit: "deposit_requested",
  paid: "deposit_paid",
  handoff: "rep_handoff",
  won: "closed_won",
  lost: "closed_lost",
};

/*
|--------------------------------------------------------------------------
| INTENT DETECTION ENGINE
|--------------------------------------------------------------------------
*/

export function detectIntent(message: string): MayaIntent {
  const lower = message.toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | LIST / VIEW LEADS
  |--------------------------------------------------------------------------
  */

  if (
    lower.includes("all leads") ||
    lower.includes("show leads") ||
    lower.includes("list leads")
  ) {
    return {
      intent: "show_all_leads",
      confidence: 0.95,
      input: message,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | HOT LEADS
  |--------------------------------------------------------------------------
  */

  if (
    lower.includes("hot leads") ||
    lower.includes("show hot")
  ) {
    return {
      intent: "show_hot_leads",
      confidence: 0.95,
      input: message,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | PRICE OBJECTION
  |--------------------------------------------------------------------------
  */

  if (
    lower.includes("too expensive") ||
    lower.includes("price too high") ||
    lower.includes("cant afford")
  ) {
    return {
      intent: "price_objection",
      confidence: 0.97,
      input: message,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | DEPOSIT PAID
  |--------------------------------------------------------------------------
  */

  if (
    lower.includes("deposit paid") ||
    lower.includes("mark paid")
  ) {
    return {
      intent: "deposit_paid",
      confidence: 0.98,
      input: message,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | PIPELINE
  |--------------------------------------------------------------------------
  */

  if (lower.includes("pipeline summary")) {
    return {
      intent: "pipeline_summary",
      confidence: 0.95,
      input: message,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | MOVE STAGE
  |--------------------------------------------------------------------------
  */

  if (
    lower.includes("move") &&
    lower.includes("sourcing")
  ) {
    return {
      intent: "move_stage",
      confidence: 0.92,
      input: message,
      entities: {
        targetStage: stageMap.sourcing,
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | ASSIGN REP
  |--------------------------------------------------------------------------
  */

  if (
    lower.includes("assign") &&
    lower.includes("rep")
  ) {
    return {
      intent: "assign_rep",
      confidence: 0.9,
      input: message,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE LEAD
  |--------------------------------------------------------------------------
  */

  if (
    lower.includes("add lead") ||
    lower.includes("new lead") ||
    lower.includes("create lead")
  ) {
    return {
      intent: "create_lead",
      confidence: 0.95,
      input: message,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE LEAD
  |--------------------------------------------------------------------------
  */

  if (
    lower.includes("delete lead") ||
    lower.includes("remove lead")
  ) {
    return {
      intent: "delete_lead",
      confidence: 0.95,
      input: message,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | FALLBACK
  |--------------------------------------------------------------------------
  */

  return {
    intent: "general_chat",
    confidence: 0.5,
    input: message,
  };
}