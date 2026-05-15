"use client"

import * as React from "react"
import { X, Phone, Mail, MapPin, Calendar, DollarSign, CreditCard, Clock, User, Flame, Pause, CheckCircle } from "lucide-react"

import { useCRM } from "@/lib/crm-context"
import { 
  Lead, 
  PIPELINE_STAGES, 
  formatCurrency, 
  getStatusColor, 
  getStatusLabel,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

import { ConversationTab } from "./conversation-tab"
import { WorkflowLogsTab } from "./workflow-logs-tab"
import { SourcingTab } from "./sourcing-tab"

export function LeadDetailsPanel() {
  const { selectedLead, setSelectedLead, isDetailsPanelOpen, setIsDetailsPanelOpen, leads, setLeads } = useCRM()

  const [stageHistory, setStageHistory] = React.useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = React.useState(false)

  const handleClose = () => {
    setIsDetailsPanelOpen(false)
    setTimeout(() => setSelectedLead(null), 300)
  }

  // Load real stage history
  React.useEffect(() => {
    async function loadStageHistory() {
      if (!selectedLead) return
      setLoadingHistory(true)
      try {
        const history = await getStageHistory()
        setStageHistory(history[selectedLead.id] || [
          { stage: selectedLead.stage, timestamp: selectedLead.createdAt, note: "Lead created" }
        ])
      } catch (err) {
        console.error("Failed to load stage history:", err)
        setStageHistory([
          { stage: selectedLead.stage, timestamp: selectedLead.createdAt, note: "Lead created" }
        ])
      } finally {
        setLoadingHistory(false)
      }
    }

    if (selectedLead) {
      loadStageHistory()
    }
  }, [selectedLead])

  const toggleStatus = (status: "hot" | "automation_paused" | "deposit_paid") => {
    if (!selectedLead) return

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === selectedLead.id
          ? {
              ...lead,
              statuses: lead.statuses.includes(status)
                ? lead.statuses.filter((s) => s !== status)
                : [...lead.statuses, status],
            }
          : lead
      )
    )

    setSelectedLead({
      ...selectedLead,
      statuses: selectedLead.statuses.includes(status)
        ? selectedLead.statuses.filter((s) => s !== status)
        : [...selectedLead.statuses, status],
    })
  }

  if (!selectedLead) return null

  return (
    <Sheet open={isDetailsPanelOpen} onOpenChange={setIsDetailsPanelOpen}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{selectedLead.name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {PIPELINE_STAGES.find((s) => s.id === selectedLead.stage)?.name}
              </p>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="workflow">Workflow Logs</TabsTrigger>
              <TabsTrigger value="sourcing">Sourcing</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="p-6 pt-4 m-0">
              <div className="space-y-4">
                {/* Lead Summary Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Lead Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedLead.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{selectedLead.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedLead.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-4" />
                      <span className="text-muted-foreground">Stage:</span>
                      <Badge variant="secondary">
                        {PIPELINE_STAGES.find((s) => s.id === selectedLead.stage)?.name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-4" />
                      <span className="text-muted-foreground">Assigned Rep:</span>
                      <span className="font-medium">{selectedLead.assignedRep || "Unassigned"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Qualification Info Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Qualification Info</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">{formatCurrency(selectedLead.budget)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Down Payment:</span>
                      <span className="font-medium">{formatCurrency(selectedLead.downPayment)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{selectedLead.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Credit Status:</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          selectedLead.creditStatus === "excellent" && "border-green-500 text-green-600",
                          selectedLead.creditStatus === "good" && "border-blue-500 text-blue-600",
                          selectedLead.creditStatus === "fair" && "border-yellow-500 text-yellow-600",
                          selectedLead.creditStatus === "poor" && "border-red-500 text-red-600"
                        )}
                      >
                        {selectedLead.creditStatus.charAt(0).toUpperCase() + selectedLead.creditStatus.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Timeline:</span>
                      <span className="font-medium">{selectedLead.timeline}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stage History */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Stage History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingHistory ? (
                      <p className="text-sm text-muted-foreground">Loading history...</p>
                    ) : (
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
                    )}
                  </CardContent>
                </Card>

                {/* Status Toggles */}
                <Card>
                  <CardHeader className="pb-3">
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
                        checked={selectedLead.statuses.includes("automation_paused")}
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
                        checked={selectedLead.statuses.includes("hot")}
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
                        checked={selectedLead.statuses.includes("deposit_paid")}
                        onCheckedChange={() => toggleStatus("deposit_paid")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="conversation" className="m-0">
              <ConversationTab lead={selectedLead} />
            </TabsContent>

            <TabsContent value="workflow" className="p-6 pt-4 m-0">
              <WorkflowLogsTab leadId={selectedLead.id} />
            </TabsContent>

            <TabsContent value="sourcing" className="p-6 pt-4 m-0">
              <SourcingTab lead={selectedLead} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}