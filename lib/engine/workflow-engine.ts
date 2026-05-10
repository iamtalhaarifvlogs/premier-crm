/**
 * Workflow Engine
 * 
 * Handles workflow definitions, execution, scheduling, and event processing.
 * Supports autonomous, rep-assisted, and hybrid workflow modes.
 */

import type { Lead, PipelineStage, WorkflowLog } from "../mock-data"

// Workflow trigger types
export type WorkflowTrigger =
  | "lead_created"
  | "stage_changed"
  | "customer_replied"
  | "no_response"
  | "deposit_received"
  | "rep_assigned"
  | "automation_paused"
  | "automation_resumed"
  | "manual_trigger"
  | "scheduled"
  | "inventory_match"
  | "inventory_update"
  | "customer_inactive"
  | "high_intent_detected"

// Workflow execution modes
export type WorkflowMode = "autonomous" | "rep_assisted" | "hybrid" | "manual_only"

export interface WorkflowCondition {
  field: keyof Lead | "custom"
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "in" | "not_in"
  value: unknown
  customCheck?: (lead: Lead, context: WorkflowContext) => boolean
}

export interface WorkflowAction {
  type: "send_message" | "change_stage" | "assign_rep" | "schedule_followup" | "trigger_sourcing" | "pause_automation" | "resume_automation" | "notify_rep" | "update_status" | "log_event" | "external_api"
  params: Record<string, unknown>
  delay?: number // milliseconds
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  trigger: WorkflowTrigger
  mode: WorkflowMode
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  enabled: boolean
  priority: number // Higher = executes first
  cooldownMs?: number // Prevent re-triggering within this window
  maxExecutions?: number // Max times this can run per lead
}

export interface WorkflowContext {
  lead: Lead
  trigger: WorkflowTrigger
  triggeredBy: "maya" | "rep" | "system" | "customer"
  previousStage?: PipelineStage
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface WorkflowExecutionResult {
  workflowId: string
  workflowName: string
  success: boolean
  actionsExecuted: string[]
  skippedReason?: string
  logs: Partial<WorkflowLog>[]
}

export interface ScheduledJob {
  id: string
  workflowId: string
  leadId: string
  scheduledFor: string
  trigger: WorkflowTrigger
  status: "pending" | "running" | "completed" | "cancelled" | "failed"
  retryCount: number
  maxRetries: number
  metadata?: Record<string, unknown>
}

// Pre-defined workflow templates
export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  // New Lead Welcome Flow
  {
    id: "wf-new-lead-welcome",
    name: "New Lead Welcome",
    description: "Send welcome message when a new lead enters the system",
    trigger: "lead_created",
    mode: "autonomous",
    conditions: [],
    actions: [
      {
        type: "send_message",
        params: {
          templateId: "welcome_v2",
          sender: "maya",
        },
      },
      {
        type: "schedule_followup",
        params: {
          delayMinutes: 15,
          templateId: "qualification_start",
        },
      },
      {
        type: "log_event",
        params: {
          event: "welcome_sent",
        },
      },
    ],
    enabled: true,
    priority: 100,
  },

  // Customer Response Handler
  {
    id: "wf-customer-response",
    name: "Customer Response Handler",
    description: "Process customer replies and determine next action",
    trigger: "customer_replied",
    mode: "hybrid",
    conditions: [],
    actions: [
      {
        type: "update_status",
        params: {
          addStatus: "customer_replied",
        },
      },
      {
        type: "log_event",
        params: {
          event: "response_analyzed",
        },
      },
    ],
    enabled: true,
    priority: 90,
  },

  // No Response Follow-up (24h)
  {
    id: "wf-no-response-24h",
    name: "24h No Response Follow-up",
    description: "Send follow-up after 24 hours of no response",
    trigger: "no_response",
    mode: "autonomous",
    conditions: [
      {
        field: "custom",
        operator: "equals",
        value: true,
        customCheck: (lead) => !lead.statuses.includes("automation_paused"),
      },
    ],
    actions: [
      {
        type: "send_message",
        params: {
          templateId: "followup_24h",
          sender: "maya",
        },
      },
      {
        type: "schedule_followup",
        params: {
          delayMinutes: 60 * 24, // Another 24h
          templateId: "followup_48h",
        },
      },
    ],
    enabled: true,
    priority: 50,
    cooldownMs: 60 * 60 * 1000, // 1 hour cooldown
  },

  // Hot Lead Detection
  {
    id: "wf-hot-lead-detection",
    name: "Hot Lead Detection",
    description: "Mark leads as hot based on engagement signals",
    trigger: "customer_replied",
    mode: "autonomous",
    conditions: [
      {
        field: "timeline",
        operator: "contains",
        value: "immediate",
      },
    ],
    actions: [
      {
        type: "update_status",
        params: {
          addStatus: "hot",
        },
      },
      {
        type: "notify_rep",
        params: {
          priority: "high",
          message: "Hot lead detected - immediate timeline",
        },
      },
    ],
    enabled: true,
    priority: 95,
  },

  // Qualification Complete - Trigger Sourcing
  {
    id: "wf-qualification-to-sourcing",
    name: "Qualification to Sourcing",
    description: "Trigger vehicle sourcing when qualification is complete",
    trigger: "stage_changed",
    mode: "autonomous",
    conditions: [
      {
        field: "stage",
        operator: "equals",
        value: "vehicle_sourcing",
      },
    ],
    actions: [
      {
        type: "trigger_sourcing",
        params: {
          searchType: "primary",
          maxResults: 5,
        },
      },
      {
        type: "send_message",
        params: {
          templateId: "sourcing_started",
          sender: "maya",
        },
      },
    ],
    enabled: true,
    priority: 85,
  },

  // Inventory Match Found
  {
    id: "wf-inventory-match",
    name: "Inventory Match Notification",
    description: "Notify when a matching vehicle is found",
    trigger: "inventory_match",
    mode: "hybrid",
    conditions: [],
    actions: [
      {
        type: "send_message",
        params: {
          templateId: "vehicle_match_found",
          sender: "maya",
        },
      },
      {
        type: "notify_rep",
        params: {
          priority: "medium",
          message: "Vehicle match found for customer",
        },
      },
    ],
    enabled: true,
    priority: 80,
  },

  // Deposit Request Flow
  {
    id: "wf-deposit-request",
    name: "Deposit Request",
    description: "Handle deposit request stage",
    trigger: "stage_changed",
    mode: "rep_assisted",
    conditions: [
      {
        field: "stage",
        operator: "equals",
        value: "deposit_requested",
      },
    ],
    actions: [
      {
        type: "send_message",
        params: {
          templateId: "deposit_request",
          sender: "maya",
        },
      },
      {
        type: "notify_rep",
        params: {
          priority: "high",
          message: "Deposit requested - awaiting payment",
        },
      },
      {
        type: "schedule_followup",
        params: {
          delayMinutes: 60 * 4, // 4 hours
          templateId: "deposit_reminder",
        },
      },
    ],
    enabled: true,
    priority: 75,
  },

  // Deposit Received
  {
    id: "wf-deposit-received",
    name: "Deposit Confirmation",
    description: "Confirm deposit and prepare for handoff",
    trigger: "deposit_received",
    mode: "hybrid",
    conditions: [],
    actions: [
      {
        type: "update_status",
        params: {
          addStatus: "deposit_paid",
        },
      },
      {
        type: "send_message",
        params: {
          templateId: "deposit_confirmation",
          sender: "maya",
        },
      },
      {
        type: "notify_rep",
        params: {
          priority: "urgent",
          message: "Deposit received - ready for rep handoff",
        },
      },
    ],
    enabled: true,
    priority: 95,
  },

  // Rep Handoff
  {
    id: "wf-rep-handoff",
    name: "Rep Handoff",
    description: "Handle transition from Maya to rep",
    trigger: "stage_changed",
    mode: "manual_only",
    conditions: [
      {
        field: "stage",
        operator: "equals",
        value: "rep_handoff",
      },
    ],
    actions: [
      {
        type: "send_message",
        params: {
          templateId: "rep_introduction",
          sender: "maya",
        },
      },
      {
        type: "pause_automation",
        params: {
          reason: "rep_takeover",
        },
      },
      {
        type: "notify_rep",
        params: {
          priority: "urgent",
          message: "Lead handed off - please follow up",
        },
      },
    ],
    enabled: true,
    priority: 100,
  },

  // Customer Inactive
  {
    id: "wf-customer-inactive",
    name: "Customer Inactive Handler",
    description: "Handle leads that have gone cold",
    trigger: "customer_inactive",
    mode: "autonomous",
    conditions: [
      {
        field: "custom",
        operator: "equals",
        value: true,
        customCheck: (lead) => !["closed_won", "closed_lost"].includes(lead.stage),
      },
    ],
    actions: [
      {
        type: "send_message",
        params: {
          templateId: "reengagement_attempt",
          sender: "maya",
        },
      },
      {
        type: "schedule_followup",
        params: {
          delayMinutes: 60 * 24 * 3, // 3 days
          templateId: "final_attempt",
        },
      },
    ],
    enabled: true,
    priority: 40,
    maxExecutions: 3,
  },
]

// Workflow execution engine
export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition>
  private executionHistory: Map<string, { workflowId: string; timestamp: number }[]>
  private scheduledJobs: Map<string, ScheduledJob>
  private settings: { mayaAutomation: boolean; followUpScheduling: boolean; killSwitch: boolean }

  constructor(settings: { mayaAutomation: boolean; followUpScheduling: boolean; killSwitch: boolean }) {
    this.workflows = new Map()
    this.executionHistory = new Map()
    this.scheduledJobs = new Map()
    this.settings = settings

    // Load default workflows
    WORKFLOW_DEFINITIONS.forEach((wf) => {
      this.workflows.set(wf.id, wf)
    })
  }

  updateSettings(settings: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...settings }
  }

  // Process an event and trigger relevant workflows
  async processEvent(context: WorkflowContext): Promise<WorkflowExecutionResult[]> {
    const results: WorkflowExecutionResult[] = []

    // Kill switch check
    if (this.settings.killSwitch) {
      return [{
        workflowId: "system",
        workflowName: "Kill Switch Active",
        success: false,
        actionsExecuted: [],
        skippedReason: "Kill switch is active - all automations paused",
        logs: [],
      }]
    }

    // Get workflows matching this trigger, sorted by priority
    const matchingWorkflows = Array.from(this.workflows.values())
      .filter((wf) => wf.trigger === context.trigger && wf.enabled)
      .sort((a, b) => b.priority - a.priority)

    for (const workflow of matchingWorkflows) {
      const result = await this.executeWorkflow(workflow, context)
      results.push(result)
    }

    return results
  }

  // Execute a single workflow
  private async executeWorkflow(
    workflow: WorkflowDefinition,
    context: WorkflowContext
  ): Promise<WorkflowExecutionResult> {
    const result: WorkflowExecutionResult = {
      workflowId: workflow.id,
      workflowName: workflow.name,
      success: false,
      actionsExecuted: [],
      logs: [],
    }

    // Check mode permissions
    if (!this.canExecuteMode(workflow.mode)) {
      result.skippedReason = `Workflow mode ${workflow.mode} not permitted with current settings`
      return result
    }

    // Check cooldown
    if (workflow.cooldownMs && this.isInCooldown(workflow.id, context.lead.id, workflow.cooldownMs)) {
      result.skippedReason = "Workflow in cooldown period"
      return result
    }

    // Check max executions
    if (workflow.maxExecutions && this.getExecutionCount(workflow.id, context.lead.id) >= workflow.maxExecutions) {
      result.skippedReason = `Max executions (${workflow.maxExecutions}) reached for this lead`
      return result
    }

    // Check conditions
    const conditionsPass = this.evaluateConditions(workflow.conditions, context)
    if (!conditionsPass) {
      result.skippedReason = "Conditions not met"
      return result
    }

    // Execute actions
    for (const action of workflow.actions) {
      try {
        const actionResult = await this.executeAction(action, context)
        result.actionsExecuted.push(action.type)
        result.logs.push({
          leadId: context.lead.id,
          timestamp: new Date().toISOString(),
          workflowName: workflow.name,
          triggerEvent: context.trigger,
          action: action.type,
          status: "success",
          metadata: JSON.stringify(actionResult),
        })
      } catch {
        result.logs.push({
          leadId: context.lead.id,
          timestamp: new Date().toISOString(),
          workflowName: workflow.name,
          triggerEvent: context.trigger,
          action: action.type,
          status: "failed",
          metadata: JSON.stringify({ error: "Execution failed" }),
        })
      }
    }

    // Record execution
    this.recordExecution(workflow.id, context.lead.id)

    result.success = true
    return result
  }

  private canExecuteMode(mode: WorkflowMode): boolean {
    switch (mode) {
      case "autonomous":
        return this.settings.mayaAutomation
      case "rep_assisted":
        return true // Always allowed
      case "hybrid":
        return this.settings.mayaAutomation
      case "manual_only":
        return true // Always allowed, requires manual trigger
      default:
        return false
    }
  }

  private evaluateConditions(conditions: WorkflowCondition[], context: WorkflowContext): boolean {
    return conditions.every((condition) => {
      if (condition.customCheck) {
        return condition.customCheck(context.lead, context)
      }

      const value = context.lead[condition.field as keyof Lead]
      switch (condition.operator) {
        case "equals":
          return value === condition.value
        case "not_equals":
          return value !== condition.value
        case "contains":
          return String(value).toLowerCase().includes(String(condition.value).toLowerCase())
        case "greater_than":
          return Number(value) > Number(condition.value)
        case "less_than":
          return Number(value) < Number(condition.value)
        case "in":
          return (condition.value as unknown[]).includes(value)
        case "not_in":
          return !(condition.value as unknown[]).includes(value)
        default:
          return true
      }
    })
  }

  private async executeAction(action: WorkflowAction, context: WorkflowContext): Promise<Record<string, unknown>> {
    // Simulate action execution delay
    if (action.delay) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(action.delay, 100))) // Cap for demo
    }

    // Return action result (in real implementation, these would actually execute)
    return {
      actionType: action.type,
      params: action.params,
      executedAt: new Date().toISOString(),
      leadId: context.lead.id,
    }
  }

  private isInCooldown(workflowId: string, leadId: string, cooldownMs: number): boolean {
    const key = `${workflowId}-${leadId}`
    const history = this.executionHistory.get(key) || []
    const lastExecution = history[history.length - 1]
    if (!lastExecution) return false
    return Date.now() - lastExecution.timestamp < cooldownMs
  }

  private getExecutionCount(workflowId: string, leadId: string): number {
    const key = `${workflowId}-${leadId}`
    return (this.executionHistory.get(key) || []).length
  }

  private recordExecution(workflowId: string, leadId: string): void {
    const key = `${workflowId}-${leadId}`
    const history = this.executionHistory.get(key) || []
    history.push({ workflowId, timestamp: Date.now() })
    this.executionHistory.set(key, history)
  }

  // Schedule a job for future execution
  scheduleJob(job: Omit<ScheduledJob, "id" | "status" | "retryCount">): ScheduledJob {
    const newJob: ScheduledJob = {
      ...job,
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      retryCount: 0,
    }
    this.scheduledJobs.set(newJob.id, newJob)
    return newJob
  }

  // Get pending jobs
  getPendingJobs(): ScheduledJob[] {
    return Array.from(this.scheduledJobs.values())
      .filter((job) => job.status === "pending")
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
  }

  // Cancel a scheduled job
  cancelJob(jobId: string): boolean {
    const job = this.scheduledJobs.get(jobId)
    if (job && job.status === "pending") {
      job.status = "cancelled"
      return true
    }
    return false
  }

  // Get all workflow definitions
  getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }

  // Toggle workflow enabled state
  toggleWorkflow(workflowId: string, enabled: boolean): void {
    const workflow = this.workflows.get(workflowId)
    if (workflow) {
      workflow.enabled = enabled
    }
  }
}

// Message templates for Maya
export const MESSAGE_TEMPLATES: Record<string, { content: string; variables: string[] }> = {
  welcome_v2: {
    content: "Hi {{name}}! I'm Maya, your virtual assistant at Premier Auto Plus. I'd love to help you find your perfect vehicle. What type of car are you looking for?",
    variables: ["name"],
  },
  qualification_start: {
    content: "To help me find the best options for you, could you tell me about your budget range and any specific features you're looking for?",
    variables: [],
  },
  followup_24h: {
    content: "Hi {{name}}, just following up on our conversation. I've been looking at some great options that might interest you. Would you like me to share what I've found?",
    variables: ["name"],
  },
  followup_48h: {
    content: "{{name}}, I wanted to check in one more time. If you're still in the market for a vehicle, I'm here to help whenever you're ready.",
    variables: ["name"],
  },
  sourcing_started: {
    content: "Great news, {{name}}! I'm now searching our inventory and partner dealerships for {{preferredVehicle}} options within your budget. I'll update you as soon as I find some matches.",
    variables: ["name", "preferredVehicle"],
  },
  vehicle_match_found: {
    content: "Exciting news! I found a {{year}} {{make}} {{model}} that matches your criteria at {{price}}. Would you like to see the details?",
    variables: ["year", "make", "model", "price"],
  },
  deposit_request: {
    content: "{{name}}, to reserve the {{preferredVehicle}} for you, we'll need a refundable deposit of $500. This ensures no one else can purchase this vehicle while we finalize the details. Ready to proceed?",
    variables: ["name", "preferredVehicle"],
  },
  deposit_reminder: {
    content: "Hi {{name}}, just a friendly reminder about the {{preferredVehicle}} you were interested in. The deposit will secure it for you. Let me know if you have any questions!",
    variables: ["name", "preferredVehicle"],
  },
  deposit_confirmation: {
    content: "Thank you, {{name}}! We've received your deposit and the {{preferredVehicle}} is now reserved for you. Your dedicated sales representative will be in touch shortly to finalize everything.",
    variables: ["name", "preferredVehicle"],
  },
  rep_introduction: {
    content: "{{name}}, I'd like to introduce you to {{repName}}, who will be your dedicated sales representative from here on. They have all the details about your preferences and will take excellent care of you!",
    variables: ["name", "repName"],
  },
  reengagement_attempt: {
    content: "Hi {{name}}, it's been a little while since we chatted. If you're still looking for a vehicle, I'd be happy to continue helping. Market conditions change frequently, and there might be new options available!",
    variables: ["name"],
  },
  final_attempt: {
    content: "{{name}}, I hope all is well. If your car search is still ongoing, feel free to reach out anytime. Wishing you the best!",
    variables: ["name"],
  },
  alternatives_presentation: {
    content: "{{name}}, I've found some alternative options that might interest you based on your preferences. Here are a few vehicles that offer great value within your budget range.",
    variables: ["name"],
  },
  handoff_notification: {
    content: "{{name}}, you're now in great hands with {{repName}}! They'll reach out to you shortly to schedule your next steps. Thank you for working with me!",
    variables: ["name", "repName"],
  },
}

// Render a message template with variables
export function renderMessageTemplate(
  templateId: string,
  variables: Record<string, string>
): string {
  const template = MESSAGE_TEMPLATES[templateId]
  if (!template) return ""

  let content = template.content
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, "g"), value)
  }
  return content
}
