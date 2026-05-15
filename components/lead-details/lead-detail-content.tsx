"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
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
  const { leads, setLeads } = useCRM()

  const urlId = params.id as string

  const [lead, setLead] = React.useState<Lead | null>(null)
  const [stageHistory, setStageHistory] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadLead() {
      setLoading(true)

      // Try to find lead with multiple possible ID formats
      let currentLead = leads.find(l => 
        l.id === urlId || 
        l.id === `lead-${urlId}` ||
        (l as any).lead_id === urlId ||
        (l as any).leadId === urlId
      )

      // If not found in context, fetch fresh from API
      if (!currentLead) {
        try {
          const freshLeads = await getLeads()
          setLeads(freshLeads)

          currentLead = freshLeads.find(l => 
            l.id === urlId || 
            l.id === `lead-${urlId}` ||
            (l as any).lead_id === urlId ||
            (l as any).leadId === urlId
          )
        } catch (err) {
          console.error("Failed to fetch leads:", err)
        }
      }

      setLead(currentLead || null)

      // Load stage history
      if (currentLead) {
        try {
          const history = await getStageHistory()
          setStageHistory(history[currentLead.id] || history[(currentLead as any).lead_id] || [
            { stage: currentLead.stage, timestamp: currentLead.createdAt, note: "Lead created" }
          ])
        } catch (err) {
          console.error("Failed to load stage history:", err)
        }
      }

      setLoading(false)
    }

    loadLead()
  }, [urlId, leads, setLeads])

  const toggleStatus = (status: "hot" | "automation_paused" | "deposit_paid") => {
    if (!lead) return
    // ... your toggle logic (keep as is)
  }

  if (loading) return <div className="flex h-full items-center justify-center">Loading lead...</div>

  if (!lead) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-semibold">Lead not found</h2>
        <p className="text-muted-foreground mt-2">Requested ID: <strong>{urlId}</strong></p>
        <Button asChild className="mt-6">
          <Link href="/pipeline">← Back to Pipeline</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
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
            <h1 className="text-3xl font-bold">{lead.name}</h1>
            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
              <span><Phone className="inline size-4 mr-1" />{lead.phone}</span>
              <span><Mail className="inline size-4 mr-1" />{lead.email}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {PIPELINE_STAGES.find(s => s.id === lead.stage)?.name}
          </Badge>
        </div>
      </div>

      {/* Tabs and rest of your content */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        {/* Your existing TabsList and TabsContent can stay the same */}
        {/* ... */}
      </Tabs>
    </div>
  )
}