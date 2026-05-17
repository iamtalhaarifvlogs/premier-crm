import { Lead } from "./types"

export interface MayaReasoningResult {
  priority: "low" | "medium" | "high"
  recommendations: string[]
  detectedSignals: string[]
  autoActions?: string[]
  summary: string
}

/*
|--------------------------------------------------------------------------
| MAIN REASONING ENGINE
|--------------------------------------------------------------------------
*/

export function analyzeLeadBehavior(
  lead: Lead,
  memory: any[]
): MayaReasoningResult {
  const recommendations: string[] = []
  const detectedSignals: string[] = []
  const autoActions: string[] = []

  /*
  |--------------------------------------------------------------------------
  | PRICE OBJECTION DETECTION
  |--------------------------------------------------------------------------
  */

  const objections = memory.filter(
    (m) => m.context_type === "objection"
  )

  if (objections.length > 0) {
    detectedSignals.push(
      "price_sensitive"
    )

    recommendations.push(
      "Offer alternative lower-priced vehicles."
    )

    autoActions.push(
      "trigger_alternative_sourcing"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | HOT LEAD DETECTION
  |--------------------------------------------------------------------------
  */

  if (
    lead.budget >= 30000 &&
    lead.timeline
      ?.toLowerCase()
      .includes("week")
  ) {
    detectedSignals.push(
      "hot_lead"
    )

    recommendations.push(
      "Assign sales rep immediately."
    )

    autoActions.push(
      "rep_handoff"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | DEPOSIT READY
  |--------------------------------------------------------------------------
  */

  if (
    lead.stage ===
      "vehicle_sourcing" &&
    objections.length === 0
  ) {
    recommendations.push(
      "Move customer toward deposit stage."
    )

    autoActions.push(
      "request_deposit"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CREDIT RISK
  |--------------------------------------------------------------------------
  */

  if (
    lead.creditStatus ===
    "poor"
  ) {
    detectedSignals.push(
      "credit_risk"
    )

    recommendations.push(
      "Prepare financing alternatives."
    )
  }

  /*
  |--------------------------------------------------------------------------
  | PRIORITY CALCULATION
  |--------------------------------------------------------------------------
  */

  let priority:
    | "low"
    | "medium"
    | "high" = "low"

  if (
    detectedSignals.includes(
      "hot_lead"
    )
  ) {
    priority = "high"
  } else if (
    recommendations.length >= 2
  ) {
    priority = "medium"
  }

  /*
  |--------------------------------------------------------------------------
  | HUMAN READABLE SUMMARY
  |--------------------------------------------------------------------------
  */

  let summary = ""

  if (priority === "high") {
    summary +=
      "This lead is considered high priority. "
  }

  if (
    detectedSignals.length > 0
  ) {
    summary +=
      `Detected signals: ${detectedSignals.join(
        ", "
      )}. `
  }

  if (
    recommendations.length > 0
  ) {
    summary +=
      `Recommended actions: ${recommendations.join(
        " "
      )}`
  }

  if (!summary.trim()) {
    summary =
      "No major behavioral indicators detected yet."
  }

  return {
    priority,
    recommendations,
    detectedSignals,
    autoActions,
    summary,
  }
}