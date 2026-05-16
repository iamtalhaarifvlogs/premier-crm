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
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Auto-hide notification
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  React.useEffect(() => {
    if (selectedLead) {
      setEditedLead({ ...selectedLead })
      setIsEditing(false)
    }
  }, [selectedLead])

  if (!selectedLead || !editedLead) return null

  const handleSave = async () => {
    if (!editedLead) return

    // Update local state immediately
    setLeads(prev => prev.map(l => l.id === editedLead.id ? editedLead : l))

    try {
      const response = await fetch('/api/leads', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TableName: "tbl_leads",
          Item: {
            lead_id: editedLead.id,
            name: editedLead.name,
            phone: editedLead.phone,
            email: editedLead.email,
            budget: editedLead.budget,
            preferredVehicle: editedLead.preferredVehicle,
            stage: editedLead.stage,
            statuses: editedLead.statuses,
            assignedRep: editedLead.assignedRep,
            lastActivity: "Just now",
            downPayment: editedLead.downPayment,
            location: editedLead.location,
            creditStatus: editedLead.creditStatus,
            timeline: editedLead.timeline,
            createdAt: editedLead.createdAt,
          }
        }),
      })

      if (response.ok) {
        setNotification({ message: "✅ Lead updated and saved to database!", type: 'success' })
      } else {
        setNotification({ message: "Lead updated locally (database update failed)", type: 'error' })
      }
    } catch (err) {
      console.error("Update failed:", err)
      setNotification({ message: "Lead updated locally (database update failed)", type: 'error' })
    }

    setSelectedLead(editedLead)
    setIsEditing(false)
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
      setNotification(null)
    }, 300)
  }

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-background border-l shadow-2xl transform transition-transform duration-300 z-50 ${isDetailsPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{editedLead.name}</h2>
            {editedLead.statuses.length > 0 && (
              <Badge variant="outline" className={getStatusColor(editedLead.statuses[0])}>
                {getStatusLabel(editedLead.statuses[0])}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
            >
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
                  <CardTitle className="flex justify-between items-center">
                    Lead Information
                    {isEditing && <span className="text-sm text-blue-600 font-medium">Editing Mode</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-5">
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
                        <Label>Budget ($)</Label>
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
                  <div className="pt-4 border-t space-y-4">
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
                    <Button onClick={handleSave} className="w-full mt-6">
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