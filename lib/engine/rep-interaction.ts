/**
 * Rep/AI Interaction Layer
 * 
 * Manages the handoff between Maya (AI) and human representatives,
 * including escalation rules, collaboration modes, and context sharing.
 */

import type { Lead, PipelineStage, Message } from "../mock-data"
import { MAYA_AUTONOMOUS_STAGES, REP_REQUIRED_STAGES, needsRepIntervention } from "./state-machine"

// Rep status
export type RepStatus = "available" | "busy" | "offline" | "in_meeting"

// Handoff types
export type HandoffType = 
  | "escalation"       // Customer requested human
  | "complexity"       // Issue too complex for Maya
  | "deposit_stage"    // Reached deposit stage
  | "high_value"       // High-value lead needs human touch
  | "negative_sentiment" // Detected frustration
  | "manual"           // Rep manually took over
  | "scheduled"        // Pre-scheduled handoff

export interface Rep {
  id: string
  name: string
  email: string
  phone: string
  status: RepStatus
  activeLeads: number
  maxLeads: number
  specializations: string[] // e.g., ["luxury", "trucks", "financing"]
  performance: {
    closedDeals: number
    avgDealValue: number
    responseTime: number // minutes
    customerSatisfaction: number // 1-5
  }
}

export interface HandoffRequest {
  id: string
  leadId: string
  fromAgent: "maya" | "system"
  toRepId: string | null
  type: HandoffType
  reason: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "accepted" | "declined" | "completed"
  contextSummary: string
  createdAt: string
  acceptedAt?: string
  completedAt?: string
}

export interface CollaborationSession {
  id: string
  leadId: string
  repId: string
  mode: "rep_primary" | "maya_assist" | "full_takeover"
  startedAt: string
  endedAt?: string
  mayaSuggestionsEnabled: boolean
  repNotes: string[]
}

export interface MayaSuggestion {
  id: string
  sessionId: string
  type: "response" | "action" | "info"
  content: string
  confidence: number
  accepted?: boolean
  timestamp: string
}

// Mock reps
export const REPS: Rep[] = [
  {
    id: "rep-john",
    name: "John Smith",
    email: "john.smith@premierauto.com",
    phone: "(555) 111-2222",
    status: "available",
    activeLeads: 8,
    maxLeads: 15,
    specializations: ["luxury", "financing"],
    performance: {
      closedDeals: 145,
      avgDealValue: 32000,
      responseTime: 12,
      customerSatisfaction: 4.8,
    },
  },
  {
    id: "rep-sarah",
    name: "Sarah Johnson",
    email: "sarah.johnson@premierauto.com",
    phone: "(555) 333-4444",
    status: "available",
    activeLeads: 6,
    maxLeads: 15,
    specializations: ["trucks", "SUVs"],
    performance: {
      closedDeals: 128,
      avgDealValue: 38000,
      responseTime: 8,
      customerSatisfaction: 4.9,
    },
  },
  {
    id: "rep-mike",
    name: "Mike Davis",
    email: "mike.davis@premierauto.com",
    phone: "(555) 555-6666",
    status: "busy",
    activeLeads: 12,
    maxLeads: 15,
    specializations: ["economy", "first-time-buyers"],
    performance: {
      closedDeals: 98,
      avgDealValue: 22000,
      responseTime: 15,
      customerSatisfaction: 4.6,
    },
  },
  {
    id: "rep-lisa",
    name: "Lisa Chen",
    email: "lisa.chen@premierauto.com",
    phone: "(555) 777-8888",
    status: "offline",
    activeLeads: 4,
    maxLeads: 15,
    specializations: ["electric", "hybrid", "luxury"],
    performance: {
      closedDeals: 112,
      avgDealValue: 45000,
      responseTime: 10,
      customerSatisfaction: 4.7,
    },
  },
]

// Interaction modes
export type InteractionMode = 
  | "maya_autonomous"    // Maya handles everything
  | "maya_with_oversight" // Maya handles but rep monitors
  | "collaborative"       // Maya assists, rep leads
  | "rep_only"           // Human only

// Get recommended interaction mode for a lead
export function getRecommendedInteractionMode(lead: Lead): {
  mode: InteractionMode
  reason: string
} {
  // Terminal stages
  if (lead.stage === "closed_won" || lead.stage === "closed_lost") {
    return { mode: "rep_only", reason: "Deal is closed" }
  }

  // Rep required stages
  if (REP_REQUIRED_STAGES.includes(lead.stage)) {
    if (lead.assignedRep) {
      return { mode: "collaborative", reason: "Rep-required stage with assigned rep" }
    }
    return { mode: "rep_only", reason: "Rep-required stage - needs rep assignment" }
  }

  // Automation paused
  if (lead.statuses.includes("automation_paused")) {
    return { mode: "rep_only", reason: "Automation is paused" }
  }

  // High-value leads
  if (lead.budget >= 40000) {
    if (lead.assignedRep) {
      return { mode: "maya_with_oversight", reason: "High-value lead with rep oversight" }
    }
    return { mode: "maya_with_oversight", reason: "High-value lead - recommend rep assignment" }
  }

  // Hot leads in Maya stages
  if (lead.statuses.includes("hot") && MAYA_AUTONOMOUS_STAGES.includes(lead.stage)) {
    return { mode: "maya_with_oversight", reason: "Hot lead - Maya with monitoring" }
  }

  // Default Maya autonomous for early stages
  if (MAYA_AUTONOMOUS_STAGES.includes(lead.stage)) {
    return { mode: "maya_autonomous", reason: "Early stage - Maya can handle autonomously" }
  }

  return { mode: "collaborative", reason: "Default collaborative mode" }
}

// Calculate the best rep for a lead
export function findBestRep(
  lead: Lead,
  reps: Rep[],
  options: { excludeIds?: string[]; requireAvailable?: boolean } = {}
): { rep: Rep | null; score: number; reason: string } {
  const { excludeIds = [], requireAvailable = true } = options
  
  const availableReps = reps.filter(rep => {
    if (excludeIds.includes(rep.id)) return false
    if (requireAvailable && rep.status !== "available") return false
    if (rep.activeLeads >= rep.maxLeads) return false
    return true
  })

  if (availableReps.length === 0) {
    return { rep: null, score: 0, reason: "No available reps" }
  }

  // Score each rep
  const scoredReps = availableReps.map(rep => {
    let score = 0
    const reasons: string[] = []

    // Capacity factor (fewer leads = higher score)
    const capacityScore = 1 - (rep.activeLeads / rep.maxLeads)
    score += capacityScore * 20
    reasons.push(`Capacity: ${Math.round(capacityScore * 100)}%`)

    // Performance factors
    score += (rep.performance.customerSatisfaction / 5) * 25
    reasons.push(`Satisfaction: ${rep.performance.customerSatisfaction}`)

    // Response time (lower is better)
    const responseScore = Math.max(0, 1 - (rep.performance.responseTime / 30))
    score += responseScore * 15
    reasons.push(`Response: ${rep.performance.responseTime}min`)

    // Specialization matching
    const vehicleType = lead.preferredVehicle.toLowerCase()
    const matchingSpecs = rep.specializations.filter(spec => 
      vehicleType.includes(spec) || 
      (spec === "luxury" && lead.budget >= 35000) ||
      (spec === "economy" && lead.budget < 20000) ||
      (spec === "first-time-buyers" && lead.creditStatus === "fair")
    )
    if (matchingSpecs.length > 0) {
      score += matchingSpecs.length * 15
      reasons.push(`Specialization match: ${matchingSpecs.join(", ")}`)
    }

    // Deal value alignment
    const valueDiff = Math.abs(rep.performance.avgDealValue - lead.budget)
    const valueAlignment = Math.max(0, 1 - (valueDiff / 50000))
    score += valueAlignment * 10
    reasons.push(`Value alignment: ${Math.round(valueAlignment * 100)}%`)

    return { rep, score, reason: reasons.join("; ") }
  })

  // Sort by score descending
  scoredReps.sort((a, b) => b.score - a.score)
  return scoredReps[0]
}

// Generate context summary for handoff
export function generateHandoffContext(
  lead: Lead,
  messages: Message[],
  stageHistory: { stage: PipelineStage; timestamp: string; note?: string }[]
): string {
  const sections: string[] = []

  // Lead overview
  sections.push(`**Lead: ${lead.name}**`)
  sections.push(`- Budget: $${lead.budget.toLocaleString()}`)
  sections.push(`- Vehicle: ${lead.preferredVehicle}`)
  sections.push(`- Timeline: ${lead.timeline}`)
  sections.push(`- Credit: ${lead.creditStatus}`)
  sections.push(`- Location: ${lead.location}`)

  // Current status
  sections.push(`\n**Current Stage: ${lead.stage}**`)
  if (lead.statuses.length > 0) {
    sections.push(`Status flags: ${lead.statuses.join(", ")}`)
  }

  // Recent conversation summary
  if (messages.length > 0) {
    sections.push("\n**Recent Conversation:**")
    const recentMessages = messages.slice(-5)
    recentMessages.forEach(msg => {
      const sender = msg.sender === "customer" ? lead.name : msg.sender === "maya" ? "Maya" : "Rep"
      sections.push(`- ${sender}: "${msg.content.substring(0, 100)}${msg.content.length > 100 ? "..." : ""}"`)
    })
  }

  // Stage progression
  if (stageHistory.length > 0) {
    sections.push("\n**Journey:**")
    stageHistory.slice(-5).forEach(entry => {
      sections.push(`- ${entry.stage}${entry.note ? ` (${entry.note})` : ""}`)
    })
  }

  // Key insights
  sections.push("\n**Key Insights:**")
  if (lead.statuses.includes("hot")) {
    sections.push("- HIGH INTENT - Customer showing strong buying signals")
  }
  if (lead.budget >= 35000) {
    sections.push("- Premium customer - consider luxury options")
  }
  if (lead.timeline.toLowerCase().includes("immediate")) {
    sections.push("- URGENT - Customer wants to buy quickly")
  }
  if (lead.downPayment / lead.budget >= 0.2) {
    sections.push("- Strong down payment indicates serious buyer")
  }

  return sections.join("\n")
}

// Check if handoff is needed
export function checkHandoffNeeded(
  lead: Lead,
  messages: Message[],
  settings: { mayaAutomation: boolean }
): { needed: boolean; type: HandoffType; reason: string; priority: HandoffRequest["priority"] } | null {
  // Automation off means everything needs human
  if (!settings.mayaAutomation) {
    return {
      needed: true,
      type: "manual",
      reason: "Maya automation is disabled",
      priority: "medium",
    }
  }

  // Check intervention needs
  const intervention = needsRepIntervention(lead)
  if (intervention.needed) {
    return {
      needed: true,
      type: "escalation",
      reason: intervention.reason || "Rep intervention required",
      priority: "high",
    }
  }

  // Stage-based checks
  if (lead.stage === "deposit_requested" && !lead.assignedRep) {
    return {
      needed: true,
      type: "deposit_stage",
      reason: "Deposit stage requires rep assignment",
      priority: "urgent",
    }
  }

  // High-value check
  if (lead.budget >= 50000 && !lead.assignedRep) {
    return {
      needed: true,
      type: "high_value",
      reason: "High-value lead should have dedicated rep",
      priority: "high",
    }
  }

  // Check recent messages for escalation triggers
  if (messages.length > 0) {
    const recentCustomerMessages = messages
      .filter(m => m.sender === "customer")
      .slice(-3)
    
    for (const msg of recentCustomerMessages) {
      const content = msg.content.toLowerCase()
      
      // Customer requested human
      if (content.includes("speak to someone") || 
          content.includes("talk to a person") || 
          content.includes("human") ||
          content.includes("real person") ||
          content.includes("manager")) {
        return {
          needed: true,
          type: "escalation",
          reason: "Customer requested human assistance",
          priority: "urgent",
        }
      }

      // Negative sentiment detection
      if (content.includes("frustrated") ||
          content.includes("disappointed") ||
          content.includes("unacceptable") ||
          content.includes("ridiculous") ||
          content.includes("waste of time")) {
        return {
          needed: true,
          type: "negative_sentiment",
          reason: "Negative sentiment detected",
          priority: "high",
        }
      }
    }
  }

  return null
}

// Create a handoff request
export function createHandoffRequest(
  lead: Lead,
  type: HandoffType,
  reason: string,
  priority: HandoffRequest["priority"],
  contextSummary: string,
  targetRepId?: string
): HandoffRequest {
  return {
    id: `handoff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    leadId: lead.id,
    fromAgent: "maya",
    toRepId: targetRepId || null,
    type,
    reason,
    priority,
    status: "pending",
    contextSummary,
    createdAt: new Date().toISOString(),
  }
}

// Maya's suggested responses during collaboration
export function generateMayaSuggestions(
  lead: Lead,
  messages: Message[],
  mode: InteractionMode
): MayaSuggestion[] {
  if (mode === "rep_only") return []

  const suggestions: MayaSuggestion[] = []
  const sessionId = `session-${lead.id}`

  // Analyze last customer message
  const lastCustomerMessage = [...messages].reverse().find(m => m.sender === "customer")
  if (!lastCustomerMessage) return suggestions

  const content = lastCustomerMessage.content.toLowerCase()

  // Price inquiry
  if (content.includes("price") || content.includes("cost") || content.includes("how much")) {
    suggestions.push({
      id: `sug-${Date.now()}-1`,
      sessionId,
      type: "response",
      content: `Based on your budget of $${lead.budget.toLocaleString()}, I found several options. The ${lead.preferredVehicle} ranges from $${Math.round(lead.budget * 0.85).toLocaleString()} to $${Math.round(lead.budget * 1.1).toLocaleString()} depending on mileage and trim level.`,
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    })
  }

  // Availability question
  if (content.includes("available") || content.includes("in stock") || content.includes("when can")) {
    suggestions.push({
      id: `sug-${Date.now()}-2`,
      sessionId,
      type: "response",
      content: `We currently have 3 matching vehicles in stock. I can schedule a viewing at your convenience. What days work best for you?`,
      confidence: 0.8,
      timestamp: new Date().toISOString(),
    })
  }

  // Financing question
  if (content.includes("financ") || content.includes("payment") || content.includes("monthly") || content.includes("loan")) {
    suggestions.push({
      id: `sug-${Date.now()}-3`,
      sessionId,
      type: "response",
      content: `With your down payment of $${lead.downPayment.toLocaleString()} on a ${lead.budget.toLocaleString()} vehicle, estimated monthly payments would be around $${Math.round((lead.budget - lead.downPayment) / 60).toLocaleString()}/month over 60 months. Would you like me to connect you with our financing specialist?`,
      confidence: 0.75,
      timestamp: new Date().toISOString(),
    })
  }

  // Action suggestions based on stage
  if (lead.stage === "vehicle_sourcing") {
    suggestions.push({
      id: `sug-${Date.now()}-4`,
      sessionId,
      type: "action",
      content: "Run expanded inventory search across partner dealerships",
      confidence: 0.7,
      timestamp: new Date().toISOString(),
    })
  }

  if (lead.stage === "alternatives_presented" && lead.statuses.includes("hot")) {
    suggestions.push({
      id: `sug-${Date.now()}-5`,
      sessionId,
      type: "action",
      content: "Customer showing high intent - recommend moving to deposit request",
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    })
  }

  // Info suggestion
  suggestions.push({
    id: `sug-${Date.now()}-6`,
    sessionId,
    type: "info",
    content: `Lead health score: ${Math.round(Math.random() * 30 + 70)}/100 | Avg response time: 12 min | Similar leads close in: 8 days avg`,
    confidence: 0.9,
    timestamp: new Date().toISOString(),
  })

  return suggestions
}

// Track rep activity
export interface RepActivity {
  repId: string
  action: "viewed_lead" | "sent_message" | "made_call" | "updated_status" | "closed_deal" | "scheduled_appointment"
  leadId: string
  timestamp: string
  details?: string
}

export function logRepActivity(
  repId: string,
  action: RepActivity["action"],
  leadId: string,
  details?: string
): RepActivity {
  return {
    repId,
    action,
    leadId,
    timestamp: new Date().toISOString(),
    details,
  }
}

// Rep notification types
export type RepNotification = {
  id: string
  repId: string
  type: "new_lead" | "handoff" | "deposit_received" | "customer_waiting" | "hot_lead" | "escalation"
  title: string
  message: string
  leadId: string
  priority: "low" | "medium" | "high" | "urgent"
  read: boolean
  createdAt: string
}

// Create notification for rep
export function createRepNotification(
  repId: string,
  type: RepNotification["type"],
  lead: Lead,
  customMessage?: string
): RepNotification {
  const notifications: Record<RepNotification["type"], { title: string; message: string; priority: RepNotification["priority"] }> = {
    new_lead: {
      title: "New Lead Assigned",
      message: `${lead.name} has been assigned to you. Budget: $${lead.budget.toLocaleString()}`,
      priority: "medium",
    },
    handoff: {
      title: "Lead Handoff",
      message: `${lead.name} ready for handoff from Maya. ${lead.statuses.includes("hot") ? "HOT LEAD!" : ""}`,
      priority: lead.statuses.includes("hot") ? "urgent" : "high",
    },
    deposit_received: {
      title: "Deposit Received!",
      message: `${lead.name} has paid their deposit. Ready to finalize deal.`,
      priority: "urgent",
    },
    customer_waiting: {
      title: "Customer Waiting",
      message: `${lead.name} is waiting for a response. Last message: ${Math.round(Math.random() * 30 + 5)} minutes ago.`,
      priority: "high",
    },
    hot_lead: {
      title: "Hot Lead Alert",
      message: `${lead.name} is showing high intent. Recommended immediate contact.`,
      priority: "urgent",
    },
    escalation: {
      title: "Escalation Required",
      message: customMessage || `${lead.name} needs immediate attention.`,
      priority: "urgent",
    },
  }

  const config = notifications[type]
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    repId,
    type,
    title: config.title,
    message: customMessage || config.message,
    leadId: lead.id,
    priority: config.priority,
    read: false,
    createdAt: new Date().toISOString(),
  }
}
