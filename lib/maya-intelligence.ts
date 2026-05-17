// lib/maya-intelligence.ts

export type MayaIntent =
  | "show_leads"
  | "lead_summary"
  | "price_objection"
  | "deposit_paid"
  | "move_stage"
  | "find_vehicle"
  | "followup"
  | "unknown"

export function detectIntent(
  message: string
): MayaIntent {
  const lower = message.toLowerCase()

  if (
    lower.includes("show leads") ||
    lower.includes("all leads")
  ) {
    return "show_leads"
  }

  if (
    lower.includes("price too high") ||
    lower.includes("too expensive") ||
    lower.includes("cant afford")
  ) {
    return "price_objection"
  }

  if (
    lower.includes("deposit paid") ||
    lower.includes("paid deposit")
  ) {
    return "deposit_paid"
  }

  if (
    lower.includes("move to sourcing") ||
    lower.includes("vehicle sourcing")
  ) {
    return "move_stage"
  }

  if (
    lower.includes("find vehicle") ||
    lower.includes("alternatives")
  ) {
    return "find_vehicle"
  }

  return "unknown"
}

export function generateLeadInsights(lead: any) {
  let score = 50

  if (lead.budget > 30000) score += 10

  if (
    lead.creditStatus === "excellent"
  ) {
    score += 20
  }

  if (
    lead.statuses?.includes("hot")
  ) {
    score += 15
  }

  if (
    lead.statuses?.includes("deposit_paid")
  ) {
    score += 30
  }

  return {
    score,
    priority:
      score >= 80
        ? "high"
        : score >= 60
        ? "medium"
        : "low",

    recommendation:
      score >= 80
        ? "Rep follow-up recommended immediately."
        : "Continue qualification process.",
  }
}