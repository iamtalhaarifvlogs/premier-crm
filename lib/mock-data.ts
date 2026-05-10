export type LeadStatus = "hot" | "automation_paused" | "customer_replied" | "deposit_paid"

export type PipelineStage = 
  | "new_lead"
  | "maya_qualification"
  | "vehicle_sourcing"
  | "alternatives_presented"
  | "deposit_requested"
  | "deposit_paid"
  | "rep_handoff"
  | "closed_won"
  | "closed_lost"

export const PIPELINE_STAGES: { id: PipelineStage; name: string }[] = [
  { id: "new_lead", name: "New Lead" },
  { id: "maya_qualification", name: "Maya Qualification" },
  { id: "vehicle_sourcing", name: "Vehicle Sourcing" },
  { id: "alternatives_presented", name: "Alternatives Presented" },
  { id: "deposit_requested", name: "Deposit Requested" },
  { id: "deposit_paid", name: "Deposit Paid" },
  { id: "rep_handoff", name: "Rep Handoff" },
  { id: "closed_won", name: "Closed Won" },
  { id: "closed_lost", name: "Closed Lost" },
]

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  budget: number
  preferredVehicle: string
  stage: PipelineStage
  statuses: LeadStatus[]
  assignedRep: string | null
  lastActivity: string
  downPayment: number
  location: string
  creditStatus: "excellent" | "good" | "fair" | "poor"
  timeline: string
  createdAt: string
}

export interface Message {
  id: string
  leadId: string
  sender: "customer" | "maya" | "rep" | "system"
  content: string
  timestamp: string
}

export interface WorkflowLog {
  id: string
  leadId: string
  timestamp: string
  workflowName: string
  triggerEvent: string
  action: string
  status: "success" | "skipped" | "failed"
  metadata: string
}

export interface StageHistoryItem {
  stage: PipelineStage
  timestamp: string
  note?: string
}

export interface VehicleMatch {
  id: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  color: string
  dealership: string
  matchScore: number
}

export interface ScheduledJob {
  id: string
  leadId: string
  runAt: string
  jobType: string
  status: "pending" | "completed" | "cancelled"
}

// Mock leads data
export const mockLeads: Lead[] = [
  {
    id: "lead-001",
    name: "Sarah Johnson",
    phone: "(555) 123-4567",
    email: "sarah.johnson@email.com",
    budget: 25000,
    preferredVehicle: "Honda Accord 2022",
    stage: "new_lead",
    statuses: ["hot"],
    assignedRep: null,
    lastActivity: "2h ago",
    downPayment: 5000,
    location: "Austin, TX",
    creditStatus: "excellent",
    timeline: "Within 2 weeks",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "lead-002",
    name: "Michael Chen",
    phone: "(555) 234-5678",
    email: "m.chen@email.com",
    budget: 18000,
    preferredVehicle: "Toyota Camry 2020",
    stage: "maya_qualification",
    statuses: ["customer_replied"],
    assignedRep: "John",
    lastActivity: "4h ago",
    downPayment: 3000,
    location: "Dallas, TX",
    creditStatus: "good",
    timeline: "1 month",
    createdAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "lead-003",
    name: "Emily Rodriguez",
    phone: "(555) 345-6789",
    email: "emily.r@email.com",
    budget: 35000,
    preferredVehicle: "BMW X3 2021",
    stage: "vehicle_sourcing",
    statuses: ["hot", "automation_paused"],
    assignedRep: "Sarah",
    lastActivity: "1d ago",
    downPayment: 10000,
    location: "Houston, TX",
    creditStatus: "excellent",
    timeline: "Immediately",
    createdAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "lead-004",
    name: "James Wilson",
    phone: "(555) 456-7890",
    email: "jwilson@email.com",
    budget: 22000,
    preferredVehicle: "Ford F-150 2019",
    stage: "alternatives_presented",
    statuses: [],
    assignedRep: "Mike",
    lastActivity: "3h ago",
    downPayment: 4000,
    location: "San Antonio, TX",
    creditStatus: "fair",
    timeline: "Within 3 months",
    createdAt: "2024-01-12T16:45:00Z",
  },
  {
    id: "lead-005",
    name: "Amanda Lee",
    phone: "(555) 567-8901",
    email: "amanda.lee@email.com",
    budget: 28000,
    preferredVehicle: "Tesla Model 3 2022",
    stage: "deposit_requested",
    statuses: ["hot", "customer_replied"],
    assignedRep: "John",
    lastActivity: "30m ago",
    downPayment: 8000,
    location: "Austin, TX",
    creditStatus: "excellent",
    timeline: "Within 1 week",
    createdAt: "2024-01-11T11:30:00Z",
  },
  {
    id: "lead-006",
    name: "Robert Martinez",
    phone: "(555) 678-9012",
    email: "rob.martinez@email.com",
    budget: 15000,
    preferredVehicle: "Hyundai Elantra 2021",
    stage: "deposit_paid",
    statuses: ["deposit_paid"],
    assignedRep: "Sarah",
    lastActivity: "1h ago",
    downPayment: 2500,
    location: "Fort Worth, TX",
    creditStatus: "good",
    timeline: "Flexible",
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "lead-007",
    name: "Jennifer Thompson",
    phone: "(555) 789-0123",
    email: "j.thompson@email.com",
    budget: 42000,
    preferredVehicle: "Mercedes C-Class 2022",
    stage: "rep_handoff",
    statuses: ["deposit_paid"],
    assignedRep: "Mike",
    lastActivity: "5h ago",
    downPayment: 12000,
    location: "Plano, TX",
    creditStatus: "excellent",
    timeline: "Immediately",
    createdAt: "2024-01-09T13:20:00Z",
  },
  {
    id: "lead-008",
    name: "David Kim",
    phone: "(555) 890-1234",
    email: "david.kim@email.com",
    budget: 32000,
    preferredVehicle: "Lexus RX 2020",
    stage: "closed_won",
    statuses: ["deposit_paid"],
    assignedRep: "John",
    lastActivity: "2d ago",
    downPayment: 9000,
    location: "Irving, TX",
    creditStatus: "excellent",
    timeline: "Completed",
    createdAt: "2024-01-08T10:45:00Z",
  },
  {
    id: "lead-009",
    name: "Lisa Anderson",
    phone: "(555) 901-2345",
    email: "lisa.a@email.com",
    budget: 20000,
    preferredVehicle: "Mazda CX-5 2021",
    stage: "closed_lost",
    statuses: [],
    assignedRep: "Sarah",
    lastActivity: "5d ago",
    downPayment: 4000,
    location: "Arlington, TX",
    creditStatus: "fair",
    timeline: "N/A",
    createdAt: "2024-01-07T15:30:00Z",
  },
  {
    id: "lead-010",
    name: "Chris Brown",
    phone: "(555) 012-3456",
    email: "chris.brown@email.com",
    budget: 38000,
    preferredVehicle: "Audi Q5 2022",
    stage: "new_lead",
    statuses: ["hot"],
    assignedRep: null,
    lastActivity: "15m ago",
    downPayment: 10000,
    location: "Frisco, TX",
    creditStatus: "good",
    timeline: "Within 1 month",
    createdAt: "2024-01-15T14:00:00Z",
  },
]

// Mock messages for leads
export const mockMessages: Record<string, Message[]> = {
  "lead-001": [
    { id: "msg-001", leadId: "lead-001", sender: "customer", content: "Hi, I'm interested in finding a reliable sedan around $25k.", timestamp: "2024-01-15T10:30:00Z" },
    { id: "msg-002", leadId: "lead-001", sender: "maya", content: "Hello Sarah! I'm Maya, your virtual assistant at Premier Auto Plus. I'd be happy to help you find the perfect sedan. Are you looking for something new or would you consider certified pre-owned?", timestamp: "2024-01-15T10:31:00Z" },
    { id: "msg-003", leadId: "lead-001", sender: "customer", content: "I'm open to both options, but reliability is my top priority.", timestamp: "2024-01-15T10:35:00Z" },
    { id: "msg-004", leadId: "lead-001", sender: "maya", content: "That's great to know! Based on your budget and reliability requirements, I'd recommend looking at the Honda Accord or Toyota Camry. Both have excellent reliability ratings. Do you have a preference for features like fuel efficiency, tech package, or safety features?", timestamp: "2024-01-15T10:36:00Z" },
  ],
  "lead-002": [
    { id: "msg-005", leadId: "lead-002", sender: "customer", content: "Looking for a Toyota Camry, preferably 2020 or newer.", timestamp: "2024-01-14T14:20:00Z" },
    { id: "msg-006", leadId: "lead-002", sender: "maya", content: "Hi Michael! Great choice - the Camry is one of the most reliable sedans on the market. I see you have a budget of $18,000. Would you prefer the LE, SE, or XLE trim level?", timestamp: "2024-01-14T14:21:00Z" },
    { id: "msg-007", leadId: "lead-002", sender: "customer", content: "SE would be nice. What colors do you have available?", timestamp: "2024-01-14T14:30:00Z" },
  ],
}

// Mock workflow logs
export const mockWorkflowLogs: WorkflowLog[] = [
  { id: "wf-001", leadId: "lead-001", timestamp: "2024-01-15T10:30:00Z", workflowName: "New Lead Welcome", triggerEvent: "lead_created", action: "send_welcome_message", status: "success", metadata: '{"template": "welcome_v2"}' },
  { id: "wf-002", leadId: "lead-001", timestamp: "2024-01-15T10:35:00Z", workflowName: "Response Handler", triggerEvent: "customer_replied", action: "analyze_intent", status: "success", metadata: '{"intent": "vehicle_inquiry"}' },
  { id: "wf-003", leadId: "lead-002", timestamp: "2024-01-14T14:20:00Z", workflowName: "New Lead Welcome", triggerEvent: "lead_created", action: "send_welcome_message", status: "success", metadata: '{"template": "welcome_v2"}' },
  { id: "wf-004", leadId: "lead-002", timestamp: "2024-01-14T14:25:00Z", workflowName: "Qualification Flow", triggerEvent: "manual_trigger", action: "start_qualification", status: "success", metadata: '{"step": 1}' },
  { id: "wf-005", leadId: "lead-003", timestamp: "2024-01-13T09:15:00Z", workflowName: "Vehicle Sourcing", triggerEvent: "qualification_complete", action: "search_inventory", status: "success", metadata: '{"matches": 5}' },
  { id: "wf-006", leadId: "lead-003", timestamp: "2024-01-13T10:00:00Z", workflowName: "Follow-up Scheduler", triggerEvent: "no_response_24h", action: "schedule_followup", status: "skipped", metadata: '{"reason": "automation_paused"}' },
  { id: "wf-007", leadId: "lead-004", timestamp: "2024-01-12T16:45:00Z", workflowName: "Alternative Options", triggerEvent: "primary_not_available", action: "generate_alternatives", status: "success", metadata: '{"alternatives": 3}' },
  { id: "wf-008", leadId: "lead-005", timestamp: "2024-01-11T11:30:00Z", workflowName: "Deposit Request", triggerEvent: "vehicle_selected", action: "send_deposit_request", status: "success", metadata: '{"amount": 500}' },
  { id: "wf-009", leadId: "lead-006", timestamp: "2024-01-10T08:00:00Z", workflowName: "Deposit Confirmation", triggerEvent: "payment_received", action: "confirm_deposit", status: "success", metadata: '{"payment_id": "pay_abc123"}' },
  { id: "wf-010", leadId: "lead-007", timestamp: "2024-01-09T13:20:00Z", workflowName: "Rep Assignment", triggerEvent: "deposit_confirmed", action: "assign_rep", status: "success", metadata: '{"rep_id": "mike"}' },
  { id: "wf-011", leadId: "lead-008", timestamp: "2024-01-08T10:45:00Z", workflowName: "Deal Closure", triggerEvent: "contract_signed", action: "close_deal", status: "success", metadata: '{"deal_value": 32000}' },
  { id: "wf-012", leadId: "lead-009", timestamp: "2024-01-07T15:30:00Z", workflowName: "Follow-up Scheduler", triggerEvent: "no_response_72h", action: "schedule_followup", status: "failed", metadata: '{"error": "max_attempts_reached"}' },
]

// Mock stage history
export const mockStageHistory: Record<string, StageHistoryItem[]> = {
  "lead-001": [
    { stage: "new_lead", timestamp: "2024-01-15T10:30:00Z", note: "Lead created from website inquiry" },
  ],
  "lead-005": [
    { stage: "new_lead", timestamp: "2024-01-11T11:30:00Z", note: "Lead created from phone call" },
    { stage: "maya_qualification", timestamp: "2024-01-11T12:00:00Z", note: "Started qualification" },
    { stage: "vehicle_sourcing", timestamp: "2024-01-11T14:00:00Z", note: "Budget and preferences confirmed" },
    { stage: "alternatives_presented", timestamp: "2024-01-12T09:00:00Z", note: "3 vehicles presented" },
    { stage: "deposit_requested", timestamp: "2024-01-12T15:00:00Z", note: "Customer selected Tesla Model 3" },
  ],
}

// Mock vehicle matches
export const mockVehicleMatches: VehicleMatch[] = [
  { id: "v-001", make: "Honda", model: "Accord", year: 2022, price: 24500, mileage: 15000, color: "Silver", dealership: "Honda of Austin", matchScore: 95 },
  { id: "v-002", make: "Toyota", model: "Camry", year: 2021, price: 23000, mileage: 22000, color: "White", dealership: "Toyota World", matchScore: 88 },
  { id: "v-003", make: "Honda", model: "Civic", year: 2022, price: 22000, mileage: 12000, color: "Blue", dealership: "Honda of Austin", matchScore: 82 },
  { id: "v-004", make: "Mazda", model: "Mazda6", year: 2021, price: 21500, mileage: 18000, color: "Red", dealership: "Mazda Central", matchScore: 78 },
]

// Mock scheduled jobs
export const mockScheduledJobs: ScheduledJob[] = [
  { id: "job-001", leadId: "lead-001", runAt: "2024-01-16T10:00:00Z", jobType: "Follow-up Message", status: "pending" },
  { id: "job-002", leadId: "lead-002", runAt: "2024-01-16T14:00:00Z", jobType: "Qualification Reminder", status: "pending" },
  { id: "job-003", leadId: "lead-004", runAt: "2024-01-16T09:00:00Z", jobType: "Alternative Options Follow-up", status: "pending" },
  { id: "job-004", leadId: "lead-005", runAt: "2024-01-15T16:00:00Z", jobType: "Deposit Reminder", status: "completed" },
  { id: "job-005", leadId: "lead-010", runAt: "2024-01-16T11:00:00Z", jobType: "Welcome Sequence", status: "pending" },
]

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Helper function to get leads by stage
export function getLeadsByStage(leads: Lead[], stage: PipelineStage): Lead[] {
  return leads.filter(lead => lead.stage === stage)
}

// Helper function to get status badge color
export function getStatusColor(status: LeadStatus): string {
  switch (status) {
    case "hot":
      return "bg-orange-100 text-orange-700 border-orange-200"
    case "automation_paused":
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case "customer_replied":
      return "bg-green-100 text-green-700 border-green-200"
    case "deposit_paid":
      return "bg-blue-100 text-blue-700 border-blue-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function getStatusLabel(status: LeadStatus): string {
  switch (status) {
    case "hot":
      return "Hot Lead"
    case "automation_paused":
      return "Automation Paused"
    case "customer_replied":
      return "Customer Replied"
    case "deposit_paid":
      return "Deposit Paid"
    default:
      return status
  }
}
