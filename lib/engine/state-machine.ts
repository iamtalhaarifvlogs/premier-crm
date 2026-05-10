/**
 * Lead Lifecycle State Machine
 * 
 * Defines valid state transitions, guards, and side effects
 * for lead progression through the sales pipeline.
 */

import type { PipelineStage, LeadStatus, Lead } from "../mock-data"

// Valid transitions from each state
export const VALID_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  new_lead: ["maya_qualification", "closed_lost"],
  maya_qualification: ["vehicle_sourcing", "rep_handoff", "closed_lost"],
  vehicle_sourcing: ["alternatives_presented", "deposit_requested", "rep_handoff", "closed_lost"],
  alternatives_presented: ["deposit_requested", "vehicle_sourcing", "rep_handoff", "closed_lost"],
  deposit_requested: ["deposit_paid", "alternatives_presented", "closed_lost"],
  deposit_paid: ["rep_handoff", "closed_lost"],
  rep_handoff: ["closed_won", "closed_lost"],
  closed_won: [], // Terminal state
  closed_lost: ["new_lead"], // Can reactivate
}

// Stages where Maya operates autonomously
export const MAYA_AUTONOMOUS_STAGES: PipelineStage[] = [
  "new_lead",
  "maya_qualification",
  "vehicle_sourcing",
  "alternatives_presented",
]

// Stages requiring rep involvement
export const REP_REQUIRED_STAGES: PipelineStage[] = [
  "deposit_requested",
  "deposit_paid",
  "rep_handoff",
]

// Terminal stages
export const TERMINAL_STAGES: PipelineStage[] = ["closed_won", "closed_lost"]

export interface TransitionGuard {
  name: string
  check: (lead: Lead, targetStage: PipelineStage) => boolean
  errorMessage: string
}

export interface TransitionResult {
  success: boolean
  error?: string
  lead?: Lead
  sideEffects?: SideEffect[]
}

export interface SideEffect {
  type: "workflow_trigger" | "notification" | "schedule_job" | "inventory_update" | "maya_message"
  payload: Record<string, unknown>
}

// Transition guards - conditions that must be met for a transition
export const transitionGuards: TransitionGuard[] = [
  {
    name: "deposit_required_for_paid",
    check: (lead, targetStage) => {
      if (targetStage === "deposit_paid") {
        return lead.statuses.includes("deposit_paid") || lead.stage === "deposit_requested"
      }
      return true
    },
    errorMessage: "Deposit must be received before marking as paid",
  },
  {
    name: "rep_required_for_handoff",
    check: (lead, targetStage) => {
      if (targetStage === "rep_handoff") {
        return lead.assignedRep !== null
      }
      return true
    },
    errorMessage: "A rep must be assigned before handoff",
  },
  {
    name: "qualification_complete_for_sourcing",
    check: (lead, targetStage) => {
      if (targetStage === "vehicle_sourcing") {
        return lead.budget > 0 && lead.preferredVehicle.length > 0
      }
      return true
    },
    errorMessage: "Lead must have budget and vehicle preference before sourcing",
  },
  {
    name: "automation_not_paused_for_maya_stages",
    check: (lead, targetStage) => {
      if (MAYA_AUTONOMOUS_STAGES.includes(targetStage) && !["new_lead"].includes(targetStage)) {
        return !lead.statuses.includes("automation_paused")
      }
      return true
    },
    errorMessage: "Automation is paused - manual intervention required",
  },
]

// Check if a transition is valid
export function canTransition(lead: Lead, targetStage: PipelineStage): TransitionResult {
  // Check if transition is in valid list
  const validTargets = VALID_TRANSITIONS[lead.stage]
  if (!validTargets.includes(targetStage)) {
    return {
      success: false,
      error: `Cannot transition from ${lead.stage} to ${targetStage}`,
    }
  }

  // Run all guards
  for (const guard of transitionGuards) {
    if (!guard.check(lead, targetStage)) {
      return {
        success: false,
        error: guard.errorMessage,
      }
    }
  }

  return { success: true }
}

// Execute a transition with side effects
export function executeTransition(
  lead: Lead,
  targetStage: PipelineStage,
  options: { force?: boolean; triggeredBy?: "maya" | "rep" | "system" | "customer" } = {}
): TransitionResult {
  const { force = false, triggeredBy = "system" } = options

  // Check validity unless forced
  if (!force) {
    const canResult = canTransition(lead, targetStage)
    if (!canResult.success) {
      return canResult
    }
  }

  const sideEffects: SideEffect[] = []
  const previousStage = lead.stage

  // Generate side effects based on transition
  sideEffects.push(...generateTransitionSideEffects(lead, previousStage, targetStage, triggeredBy))

  // Create updated lead
  const updatedLead: Lead = {
    ...lead,
    stage: targetStage,
    lastActivity: "Just now",
  }

  // Auto-assign statuses based on stage
  if (targetStage === "deposit_paid" && !updatedLead.statuses.includes("deposit_paid")) {
    updatedLead.statuses = [...updatedLead.statuses, "deposit_paid"]
  }

  return {
    success: true,
    lead: updatedLead,
    sideEffects,
  }
}

function generateTransitionSideEffects(
  lead: Lead,
  fromStage: PipelineStage,
  toStage: PipelineStage,
  triggeredBy: string
): SideEffect[] {
  const effects: SideEffect[] = []

  // Log the transition
  effects.push({
    type: "workflow_trigger",
    payload: {
      workflowName: "Stage Transition",
      triggerEvent: "stage_changed",
      action: `${fromStage} → ${toStage}`,
      leadId: lead.id,
      triggeredBy,
    },
  })

  // Stage-specific effects
  switch (toStage) {
    case "maya_qualification":
      effects.push({
        type: "maya_message",
        payload: {
          leadId: lead.id,
          templateId: "qualification_start",
          delay: 0,
        },
      })
      effects.push({
        type: "schedule_job",
        payload: {
          leadId: lead.id,
          jobType: "qualification_followup",
          delayMinutes: 30,
        },
      })
      break

    case "vehicle_sourcing":
      effects.push({
        type: "workflow_trigger",
        payload: {
          workflowName: "Inventory Search",
          triggerEvent: "sourcing_started",
          action: "search_matching_vehicles",
          leadId: lead.id,
        },
      })
      effects.push({
        type: "inventory_update",
        payload: {
          leadId: lead.id,
          action: "reserve_matches",
          criteria: {
            budget: lead.budget,
            preferredVehicle: lead.preferredVehicle,
          },
        },
      })
      break

    case "alternatives_presented":
      effects.push({
        type: "maya_message",
        payload: {
          leadId: lead.id,
          templateId: "alternatives_presentation",
          delay: 0,
        },
      })
      break

    case "deposit_requested":
      effects.push({
        type: "notification",
        payload: {
          type: "rep_alert",
          leadId: lead.id,
          message: `Deposit requested for ${lead.name}`,
          priority: "high",
        },
      })
      effects.push({
        type: "schedule_job",
        payload: {
          leadId: lead.id,
          jobType: "deposit_reminder",
          delayMinutes: 60 * 24, // 24 hours
        },
      })
      break

    case "deposit_paid":
      effects.push({
        type: "notification",
        payload: {
          type: "rep_alert",
          leadId: lead.id,
          message: `Deposit received from ${lead.name} - ready for handoff`,
          priority: "urgent",
        },
      })
      effects.push({
        type: "inventory_update",
        payload: {
          leadId: lead.id,
          action: "confirm_reservation",
        },
      })
      break

    case "rep_handoff":
      effects.push({
        type: "notification",
        payload: {
          type: "rep_assignment",
          leadId: lead.id,
          repId: lead.assignedRep,
          message: `Lead ${lead.name} handed off to ${lead.assignedRep}`,
        },
      })
      effects.push({
        type: "maya_message",
        payload: {
          leadId: lead.id,
          templateId: "handoff_notification",
          delay: 0,
        },
      })
      break

    case "closed_won":
      effects.push({
        type: "workflow_trigger",
        payload: {
          workflowName: "Deal Closure",
          triggerEvent: "deal_won",
          action: "finalize_sale",
          leadId: lead.id,
        },
      })
      effects.push({
        type: "inventory_update",
        payload: {
          leadId: lead.id,
          action: "mark_sold",
        },
      })
      break

    case "closed_lost":
      effects.push({
        type: "workflow_trigger",
        payload: {
          workflowName: "Lead Lost",
          triggerEvent: "deal_lost",
          action: "release_reservations",
          leadId: lead.id,
        },
      })
      effects.push({
        type: "inventory_update",
        payload: {
          leadId: lead.id,
          action: "release_reservation",
        },
      })
      effects.push({
        type: "schedule_job",
        payload: {
          leadId: lead.id,
          jobType: "reactivation_attempt",
          delayMinutes: 60 * 24 * 30, // 30 days
        },
      })
      break
  }

  return effects
}

// Get next recommended actions for a lead
export function getRecommendedActions(lead: Lead): { action: string; stage?: PipelineStage; priority: "high" | "medium" | "low" }[] {
  const actions: { action: string; stage?: PipelineStage; priority: "high" | "medium" | "low" }[] = []
  const validNextStages = VALID_TRANSITIONS[lead.stage]

  // Hot leads get prioritized
  const isHot = lead.statuses.includes("hot")

  switch (lead.stage) {
    case "new_lead":
      actions.push({
        action: "Start qualification with Maya",
        stage: "maya_qualification",
        priority: isHot ? "high" : "medium",
      })
      break

    case "maya_qualification":
      if (lead.budget > 0 && lead.preferredVehicle) {
        actions.push({
          action: "Begin vehicle sourcing",
          stage: "vehicle_sourcing",
          priority: isHot ? "high" : "medium",
        })
      }
      if (!lead.assignedRep) {
        actions.push({
          action: "Assign a rep for warm handoff",
          priority: "medium",
        })
      }
      break

    case "vehicle_sourcing":
      actions.push({
        action: "Present alternative options",
        stage: "alternatives_presented",
        priority: "medium",
      })
      actions.push({
        action: "Skip to deposit request if match found",
        stage: "deposit_requested",
        priority: isHot ? "high" : "low",
      })
      break

    case "alternatives_presented":
      actions.push({
        action: "Request deposit",
        stage: "deposit_requested",
        priority: isHot ? "high" : "medium",
      })
      actions.push({
        action: "Continue sourcing",
        stage: "vehicle_sourcing",
        priority: "low",
      })
      break

    case "deposit_requested":
      actions.push({
        action: "Confirm deposit received",
        stage: "deposit_paid",
        priority: "high",
      })
      break

    case "deposit_paid":
      if (!lead.assignedRep) {
        actions.push({
          action: "Assign rep immediately",
          priority: "high",
        })
      } else {
        actions.push({
          action: "Complete rep handoff",
          stage: "rep_handoff",
          priority: "high",
        })
      }
      break

    case "rep_handoff":
      actions.push({
        action: "Close the deal",
        stage: "closed_won",
        priority: "high",
      })
      break
  }

  return actions
}

// Calculate lead health score (0-100)
export function calculateLeadHealth(lead: Lead): number {
  let score = 50 // Base score

  // Stage progression bonus
  const stageOrder: PipelineStage[] = [
    "new_lead",
    "maya_qualification",
    "vehicle_sourcing",
    "alternatives_presented",
    "deposit_requested",
    "deposit_paid",
    "rep_handoff",
  ]
  const stageIndex = stageOrder.indexOf(lead.stage)
  if (stageIndex > 0) {
    score += stageIndex * 5
  }

  // Status bonuses
  if (lead.statuses.includes("hot")) score += 15
  if (lead.statuses.includes("customer_replied")) score += 10
  if (lead.statuses.includes("deposit_paid")) score += 20

  // Status penalties
  if (lead.statuses.includes("automation_paused")) score -= 10

  // Credit status impact
  switch (lead.creditStatus) {
    case "excellent": score += 10; break
    case "good": score += 5; break
    case "fair": break
    case "poor": score -= 10; break
  }

  // Budget vs down payment ratio
  const dpRatio = lead.downPayment / lead.budget
  if (dpRatio >= 0.2) score += 10
  else if (dpRatio >= 0.1) score += 5

  // Rep assignment bonus
  if (lead.assignedRep && REP_REQUIRED_STAGES.includes(lead.stage)) {
    score += 10
  }

  // Timeline urgency
  if (lead.timeline.toLowerCase().includes("immediate")) score += 10
  else if (lead.timeline.toLowerCase().includes("week")) score += 5

  // Terminal states
  if (lead.stage === "closed_won") score = 100
  if (lead.stage === "closed_lost") score = 0

  return Math.max(0, Math.min(100, score))
}

// Determine if Maya should operate autonomously on this lead
export function shouldMayaOperate(lead: Lead, settings: { mayaAutomation: boolean; killSwitch: boolean }): boolean {
  if (settings.killSwitch) return false
  if (!settings.mayaAutomation) return false
  if (lead.statuses.includes("automation_paused")) return false
  if (!MAYA_AUTONOMOUS_STAGES.includes(lead.stage)) return false
  return true
}

// Determine if rep intervention is needed
export function needsRepIntervention(lead: Lead): { needed: boolean; reason?: string } {
  if (REP_REQUIRED_STAGES.includes(lead.stage)) {
    if (!lead.assignedRep) {
      return { needed: true, reason: "Rep assignment required for current stage" }
    }
  }

  if (lead.statuses.includes("automation_paused")) {
    return { needed: true, reason: "Automation paused - manual review needed" }
  }

  // High-value leads might need rep attention
  if (lead.budget >= 40000 && !lead.assignedRep) {
    return { needed: true, reason: "High-value lead should have rep oversight" }
  }

  return { needed: false }
}
