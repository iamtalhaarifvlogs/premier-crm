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
  ChevronRight,
} from "lucide-react"

import { useCRM, mockMessages, mockStageHistory, mockVehicleMatches } from "@/lib/crm-context"
import { Lead, PIPELINE_STAGES, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const lead = leads.find((l) => l.id === leadId)

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
  }

  if (!lead) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <h2 className="text-xl font-semibold">Lead not found</h2>
        <p className="text-muted-foreground mt-2">
          The lead you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild className="mt-4">
          <Link href="/pipeline">Go to Pipeline</Link>
        </Button>
      </div>
    )
  }

  const stageHistory = mockStageHistory[lead.id] || [
    { stage: lead.stage, timestamp: lead.createdAt, note: "Lead created" },
  ]

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
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" />
                {lead.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" />
                {lead.email}
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

        {/* Status badges */}
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

      {/* Content */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <div className="border-b px-4">
          <TabsList className="h-12 w-full justify-start rounded-none border-0 bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="conversation"
              className="rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Conversation
            </TabsTrigger>
            <TabsTrigger
              value="workflow"
              className="rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Workflow Logs
            </TabsTrigger>
            <TabsTrigger
              value="sourcing"
              className="rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Sourcing
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="overview" className="p-6 m-0">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Lead Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lead Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{lead.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="font-medium">{lead.preferredVehicle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-4" />
                    <span className="text-muted-foreground">Stage:</span>
                    <Badge variant="secondary">
                      {PIPELINE_STAGES.find((s) => s.id === lead.stage)?.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-4" />
                    <span className="text-muted-foreground">Assigned Rep:</span>
                    <span className="font-medium">{lead.assignedRep || "Unassigned"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Qualification Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Qualification Info</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">{formatCurrency(lead.budget)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Down Payment:</span>
                    <span className="font-medium">{formatCurrency(lead.downPayment)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{lead.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Credit Status:</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        lead.creditStatus === "excellent" && "border-green-500 text-green-600",
                        lead.creditStatus === "good" && "border-blue-500 text-blue-600",
                        lead.creditStatus === "fair" && "border-yellow-500 text-yellow-600",
                        lead.creditStatus === "poor" && "border-red-500 text-red-600"
                      )}
                    >
                      {lead.creditStatus.charAt(0).toUpperCase() + lead.creditStatus.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Timeline:</span>
                    <span className="font-medium">{lead.timeline}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Stage History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Stage History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-4">
                    <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />
                    <div className="space-y-4">
                      {stageHistory.map((item, index) => (
                        <div key={index} className="relative pl-4">
                          <div className="absolute -left-4 top-1.5 size-2 rounded-full bg-primary" />
                          <div>
                            <p className="text-sm font-medium">
                              {PIPELINE_STAGES.find((s) => s.id === item.stage)?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                            {item.note && (
                              <p className="text-xs text-muted-foreground mt-1">{item.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Toggles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pause className="size-4 text-yellow-600" />
                      <Label htmlFor="pause-automation" className="text-sm">
                        Pause Automation
                      </Label>
                    </div>
                    <Switch
                      id="pause-automation"
                      checked={lead.statuses.includes("automation_paused")}
                      onCheckedChange={() => toggleStatus("automation_paused")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="size-4 text-orange-500" />
                      <Label htmlFor="mark-hot" className="text-sm">
                        Mark Hot Lead
                      </Label>
                    </div>
                    <Switch
                      id="mark-hot"
                      checked={lead.statuses.includes("hot")}
                      onCheckedChange={() => toggleStatus("hot")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="size-4 text-green-500" />
                      <Label htmlFor="deposit-paid" className="text-sm">
                        Mark Deposit Paid
                      </Label>
                    </div>
                    <Switch
                      id="deposit-paid"
                      checked={lead.statuses.includes("deposit_paid")}
                      onCheckedChange={() => toggleStatus("deposit_paid")}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
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
