"use client"

import * as React from "react"
import { X, Save, Edit2, Flame, CheckCircle } from "lucide-react"

import { useCRM } from "@/lib/crm-context"
import { Lead, PIPELINE_STAGES, getStatusColor, getStatusLabel } from "@/lib/mock-data"
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

  React.useEffect(() => {
    if (selectedLead) {
      setEditedLead({ ...selectedLead })
      setIsEditing(false)
    }
  }, [selectedLead])

  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  if (!selectedLead || !editedLead) return null

  const handleSave = async () => {
    if (!editedLead) return

    // Update UI immediately
    setLeads(prev => prev.map(l => l.id === editedLead.id ? editedLead : l))

    try {
      const payload = {
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
          downPayment: editedLead.downPayment || 0,
          location: editedLead.location,
          creditStatus: editedLead.creditStatus,
          timeline: editedLead.timeline,
          createdAt: editedLead.createdAt,
        }
      }

      console.log("Sending Update Payload:", JSON.stringify(payload, null, 2))

      const response = await fetch('/api/leads', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const resultText = await response.text()
      console.log("Response Status:", response.status)
      console.log("Response Body:", resultText)

      if (response.ok) {
        setNotification({ message: "✅ Lead updated successfully in database!", type: 'success' })
      } else {
        setNotification({ message: `❌ Update failed (${response.status})`, type: 'error' })
      }
    } catch (err: any) {
      console.error("Update Error:", err)
      setNotification({ message: "❌ Failed to reach database. Saved locally only.", type: 'error' })
    }

    setSelectedLead(editedLead)
    setIsEditing(false)
  }

  const toggleStatus = (status: "hot" | "automation_paused" | "deposit_paid") => {
    const current = editedLead.statuses
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status]
    setEditedLead({ ...editedLead, statuses: updated })
  }

  const updateField = (field: keyof Lead, value: any) => {
    setEditedLead(prev => prev ? { ...prev, [field]: value } : null)
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
    <div className={`fixed inset-y-0 right-0 w-96 bg-background border-l shadow-2xl z-50 transform transition-transform duration-300 ${isDetailsPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between bg-muted/50">
          <div>
            <h2 className="font-semibold text-lg">{editedLead.name}</h2>
            <p className="text-sm text-muted-foreground">{editedLead.preferredVehicle}</p>
          </div>
          <div className="flex gap-2">
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
            <TabsContent value="overview" className="p-6 m-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Lead Details
                    {isEditing && <span className="text-blue-600 text-sm font-medium">● Editing</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-5">
                    <div>
                      <Label>Name</Label>
                      <Input value={editedLead.name} onChange={(e) => updateField("name", e.target.value)} disabled={!isEditing} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Phone</Label>
                        <Input value={editedLead.phone} onChange={(e) => updateField("phone", e.target.value)} disabled={!isEditing} />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={editedLead.email} onChange={(e) => updateField("email", e.target.value)} disabled={!isEditing} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Budget ($)</Label>
                        <Input type="number" value={editedLead.budget} onChange={(e) => updateField("budget", parseInt(e.target.value) || 0)} disabled={!isEditing} />
                      </div>
                      <div>
                        <Label>Stage</Label>
                        <Select value={editedLead.stage} onValueChange={(v) => updateField("stage", v)} disabled={!isEditing}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE_STAGES.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Preferred Vehicle</Label>
                      <Input value={editedLead.preferredVehicle} onChange={(e) => updateField("preferredVehicle", e.target.value)} disabled={!isEditing} />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Flame className="size-4 text-orange-500" />
                        <Label>Hot Lead</Label>
                      </div>
                      <Switch checked={editedLead.statuses.includes("hot")} onCheckedChange={() => toggleStatus("hot")} disabled={!isEditing} />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-green-500" />
                        <Label>Deposit Paid</Label>
                      </div>
                      <Switch checked={editedLead.statuses.includes("deposit_paid")} onCheckedChange={() => toggleStatus("deposit_paid")} disabled={!isEditing} />
                    </div>
                  </div>

                  {isEditing && (
                    <Button onClick={handleSave} className="w-full" size="lg">
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

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-[60] px-6 py-3.5 rounded-xl shadow-xl text-sm font-medium ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}