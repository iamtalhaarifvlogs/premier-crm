"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  CreditCard,
  Clock,
  User,
  Flame,
  Pause,
  CheckCircle,
  Car,
} from "lucide-react"

import { useCRM } from "@/lib/crm-context"
import { 
  Lead, 
  PIPELINE_STAGES, 
  formatCurrency, 
  getStatusColor, 
  getStatusLabel,
  getLeads,
  getStageHistory 
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

import { ConversationTab } from "@/components/lead-details/conversation-tab"
import { WorkflowLogsTab } from "@/components/lead-details/workflow-logs-tab"
import { SourcingTab } from "@/components/lead-details/sourcing-tab"

export function LeadDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { leads, setLeads } = useCRM()

  const leadId = params.id as string

  const [lead, setLead] = React.useState<Lead | null>(null)
  const [stageHistory, setStageHistory] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Load lead data (from context or directly from API)
  React.useEffect(() => {
    async function loadLeadData() {
      setLoading(true)

      // First try from context
      let currentLead = leads.find((l) => l.id === leadId)

      // If not found in context, fetch all leads
      if (!currentLead) {
        try {
          const allLeads = await getLeads()
          currentLead = allLeads.find((l) => l.id === leadId)
          if (currentLead) {
            setLeads(allLeads) // Update context
          }
        } catch (err) {
          console.error("Failed to fetch leads:", err)
        }
      }

      setLead(currentLead || null)

      // Load stage history
      if (currentLead) {
        try {
          const history = await getStageHistory()
          setStageHistory(history[currentLead.id] || [
            { stage: currentLead.stage, timestamp: currentLead.createdAt, note: "Lead created" }
          ])
        } catch (err) {
          console.error("Failed to load stage history:", err)
        }
      }

      setLoading(false)
    }

    loadLeadData()
  }, [leadId, leads, setLeads])

  const toggleStatus = (status: "hot" | "automation_paused" | "deposit_paid") => {
    if (!lead) return

    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? {
              ...l,
              statuses: l.statuses.includes(status)
                ? l.statuses.filter((s) => s !== status)
                : [...l.statuses, status],
            }
          : l
      )
    )

    // Update local lead state
    setLead((prev) =>
      prev
        ? {
            ...prev,
            statuses: prev.statuses.includes(status)
              ? prev.statuses.filter((s) => s !== status)
              : [...prev.statuses, status],
          }
        : null
    )
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading lead details...</div>
  }

  if (!lead) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <h2 className="text-xl font-semibold">Lead not found</h2>
        <p className="text-muted-foreground mt-2">Lead ID: {leadId}</p>
        <Button asChild className="mt-4">
          <Link href="/pipeline">Go to Pipeline</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header - Same as before */}
      <div className="border-b p-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/pipeline">Pipeline</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{lead.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" /> {lead.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" /> {lead.email}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {PIPELINE_STAGES.find((s) => s.id === lead.stage)?.name}
            </Badge>
            {lead.assignedRep && (
              <Badge variant="secondary">Rep: {lead.assignedRep}</Badge>
            )}
          </div>
        </div>

        {lead.statuses.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {lead.statuses.map((status) => (
              <Badge
                key={status}
                variant="outline"
                className={cn("gap-1", getStatusColor(status))}
              >
                {getStatusLabel(status)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Rest of your Tabs and content remain the same */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <div className="border-b px-4">
          <TabsList className="h-12 w-full justify-start rounded-none border-0 bg-transparent p-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="workflow">Workflow Logs</TabsTrigger>
            <TabsTrigger value="sourcing">Sourcing</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="overview" className="p-6 m-0">
            {/* Your existing overview content */}
            {/* ... (keep your existing cards for summary, qualification, stage history, toggles) */}
            {/* You can keep the rest as is */}
          </TabsContent>

          <TabsContent value="conversation" className="m-0">
            <ConversationTab lead={lead} />
          </TabsContent>

          <TabsContent value="workflow" className="p-6 m-0">
            <WorkflowLogsTab leadId={lead.id} />
          </TabsContent>

          <TabsContent value="sourcing" className="p-6 m-0">
            <SourcingTab lead={lead} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}