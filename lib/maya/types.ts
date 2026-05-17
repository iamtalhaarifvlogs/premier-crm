import { Lead } from '@/lib/mock-data'

export interface MayaResponse {
  reply: string

  actions?: MayaAction[]

  leadUpdates?: {
    leadId: string
    updates: Partial<Lead>
  }[]

  createLead?: Partial<Lead>

  deleteLeadId?: string

  workflowLogs?: WorkflowLogInput[]

  notifications?: NotificationInput[]

  memoryUpdates?: MayaMemoryInput[]
}

export interface MayaAction {
  type:
    | 'create_lead'
    | 'update_lead'
    | 'delete_lead'
    | 'move_stage'
    | 'log_objection'
    | 'assign_rep'
    | 'notify_rep'
}

export interface WorkflowLogInput {
  lead_id: string
  type: string
  message: string
  stage?: string
}

export interface NotificationInput {
  lead_id: string
  rep: string
  message: string
}

export interface MayaMemoryInput {
  lead_id: string
  context_type: string
  content: string
}