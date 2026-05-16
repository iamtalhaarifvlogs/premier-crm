"use client"

import * as React from "react"
import { X, Phone, Mail, MapPin, Calendar, DollarSign, CreditCard, Clock, User, Flame, Pause, CheckCircle, Save, Edit2 } from "lucide-react"

import { useCRM } from "@/lib/crm-context"
import { Lead, PIPELINE_STAGES, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { ConversationTab } from "./conversation-tab"
import { WorkflowLogsTab } from "./workflow-logs-tab"
import { SourcingTab } from "./sourcing-tab"

export function LeadDetailsPanel() {
  const { selectedLead, setSelectedLead, isDetailsPanelOpen, setIsDetailsPanelOpen, leads, setLeads } = useCRM()

  const [isEditing, setIsEditing] = React.useState(false)
  const [editedLead, setEditedLead] = React.useState<Lead | null>(null)

  React.useEffect(() => {
    if (selectedLead) {
      setEditedLead({ ...selectedLead })
      setIsEditing(false)
    }
  }, [selectedLead])

  if (!selectedLead || !editedLead) return null

  const handleSave = async () => {
    if (!editedLead) return

    // Update local state
    setLeads(prev => prev.map(l => l.id === editedLead.id ? editedLead : l))

    // TODO: Add API update call here later
    console.log("Lead updated:", editedLead)

    setSelectedLead(editedLead)
    setIsEditing(false)

    // Simple notification
    alert("✅ Lead updated successfully!")
  }

  const toggleStatus = (status: "hot" | "automation_paused" | "deposit_paid") => {
    const currentStatuses = editedLead.statuses
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status]

    setEditedLead({ ...editedLead, statuses: newStatuses })
  }

  const updateField = (field: keyof Lead, value: any) => {
    setEditedLead({ ...editedLead, [field]: value })
  }

  const handleClose = () => {
    setIsDetailsPanelOpen(false)
    setTimeout(() => {
      setSelectedLead(null)
      setIsEditing(false)
    }, 300)
  }

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-background border-l shadow-xl transform transition-transform duration-300 ${isDetailsPanelOpen ? 'translate-x-0' : 'translate-x-full'} z-50`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{editedLead.name}</h2>
            <Badge variant="outline">{getStatusLabel(editedLead.statuses[0] || "new")}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <Save className="size-4" /> : <Edit2 className="size-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversation">Chat</TabsTrigger>
            <TabsTrigger value="workflow">Logs</TabsTrigger>
            <TabsTrigger value="sourcing">Sourcing</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="p-6 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Lead Information
                    {isEditing && <span className="text-sm text-muted-foreground">Editing Mode</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Editable Fields */}
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input 
                        value={editedLead.name} 
                        onChange={(e) => updateField("name", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Phone</Label>
                        <Input 
                          value={editedLead.phone} 
                          onChange={(e) => updateField("phone", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input 
                          value={editedLead.email} 
                          onChange={(e) => updateField("email", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Budget</Label>
                        <Input 
                          type="number"
                          value={editedLead.budget} 
                          onChange={(e) => updateField("budget", parseInt(e.target.value) || 0)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Stage</Label>
                        <Select 
                          value={editedLead.stage} 
                          onValueChange={(value) => updateField("stage", value as PipelineStage)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE_STAGES.map(stage => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Preferred Vehicle</Label>
                      <Input 
                        value={editedLead.preferredVehicle} 
                        onChange={(e) => updateField("preferredVehicle", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  {/* Status Toggles */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="size-4 text-orange-500" />
                        <Label>Hot Lead</Label>
                      </div>
                      <Switch 
                        checked={editedLead.statuses.includes("hot")} 
                        onCheckedChange={() => toggleStatus("hot")}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-green-500" />
                        <Label>Deposit Paid</Label>
                      </div>
                      <Switch 
                        checked={editedLead.statuses.includes("deposit_paid")} 
                        onCheckedChange={() => toggleStatus("deposit_paid")}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <Button onClick={handleSave} className="w-full">
                      <Save className="mr-2 size-4" />
                      Save Changes
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversation" className="m-0">
              <ConversationTab lead={editedLead} />
            </TabsContent>

            <TabsContent value="workflow" className="p-6 m-0">
              <WorkflowLogsTab leadId={editedLead.id} />
            </TabsContent>

            <TabsContent value="sourcing" className="p-6 m-0">
              <SourcingTab lead={editedLead} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}