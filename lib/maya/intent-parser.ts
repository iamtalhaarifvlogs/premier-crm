import { PipelineStage } from "@/lib/mock-data"

export interface MayaIntent {
  intent: string
  confidence: number
  entities?: Record<string, any>
}

const stageMap: Record<string, PipelineStage> = {
  sourcing: "vehicle_sourcing",
  qualification: "maya_qualification",
  deposit: "deposit_requested",
  paid: "deposit_paid",
  handoff: "rep_handoff",
  won: "closed_won",
  lost: "closed_lost",
}

export function detectIntent(message: string): MayaIntent {
  const lower = message.toLowerCase()

  if (
    lower.includes("all leads") ||
    lower.includes("show leads") ||
    lower.includes("list leads")
  ) {
    return {
      intent: "show_all_leads",
      confidence: 0.95,
    }
  }

  if (
    lower.includes("hot leads") ||
    lower.includes("show hot")
  ) {
    return {
      intent: "show_hot_leads",
      confidence: 0.95,
    }
  }

  if (
    lower.includes("too expensive") ||
    lower.includes("price too high") ||
    lower.includes("cant afford")
  ) {
    return {
      intent: "price_objection",
      confidence: 0.97,
    }
  }

  if (
    lower.includes("deposit paid") ||
    lower.includes("mark paid")
  ) {
    return {
      intent: "deposit_paid",
      confidence: 0.98,
    }
  }

  if (lower.includes("pipeline summary")) {
    return {
      intent: "pipeline_summary",
      confidence: 0.95,
    }
  }

  if (
    lower.includes("move") &&
    lower.includes("sourcing")
  ) {
    return {
      intent: "move_stage",
      confidence: 0.92,
      entities: {
        targetStage: "vehicle_sourcing",
      },
    }
  }

  if (
    lower.includes("assign") &&
    lower.includes("rep")
  ) {
    return {
      intent: "assign_rep",
      confidence: 0.9,
    }
  }

  if (
    lower.includes("add lead") ||
    lower.includes("new lead") ||
    lower.includes("create lead")
  ) {
    return {
      intent: "create_lead",
      confidence: 0.95,
    }
  }

  if (
    lower.includes("delete lead") ||
    lower.includes("remove lead")
  ) {
    return {
      intent: "delete_lead",
      confidence: 0.95,
    }
  }

  return {
    intent: "general_chat",
    confidence: 0.5,
  }
}