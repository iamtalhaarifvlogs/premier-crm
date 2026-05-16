"use client"

import * as React from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, Search, Filter } from "lucide-react"

import { useCRM } from "@/lib/crm-context"
import {
  Lead,
  PipelineStage,
  PIPELINE_STAGES,
  getLeads,
} from "@/lib/mock-data"
import { createWorkflowLog } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { KanbanColumn } from "./kanban-column"
import { LeadCard } from "./lead-card"

type FilterType = "all" | "hot" | "deposit_pending" | "assigned" | "unassigned"

export function KanbanBoard() {
  const { leads, setLeads, moveLeadToStage, setSelectedLead, setIsDetailsPanelOpen } = useCRM()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState<FilterType>("all")
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [isAddLeadOpen, setIsAddLeadOpen] = React.useState(false)
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Auto hide notification
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Load leads
  React.useEffect(() => {
    if (leads.length === 0) {
      getLeads().then(setLeads).catch(console.error)
    }
  }, [leads.length, setLeads])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const filteredLeads = React.useMemo(() => {
    let result = leads

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.phone.includes(query) ||
        lead.preferredVehicle.toLowerCase().includes(query)
      )
    }

    switch (activeFilter) {
      case "hot":
        result = result.filter((lead) => lead.statuses.includes("hot"))
        break
      case "deposit_pending":
        result = result.filter(
          (lead) => lead.stage === "deposit_requested" && !lead.statuses.includes("deposit_paid")
        )
        break
      case "assigned":
        result = result.filter((lead) => lead.assignedRep !== null)
        break
      case "unassigned":
        result = result.filter((lead) => lead.assignedRep === null)
        break
    }

    return result
  }, [leads, searchQuery, activeFilter])

  const getLeadsForStage = (stage: PipelineStage) => {
    return filteredLeads.filter((lead) => lead.stage === stage)
  }

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const isColumn = PIPELINE_STAGES.some((stage) => stage.id === overId)

    if (isColumn) {
      moveLeadToStage(activeId, overId as PipelineStage)
    } else {
      const overLead = leads.find((l) => l.id === overId)
      if (overLead) moveLeadToStage(activeId, overLead.stage)
    }

    setActiveId(null)
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDetailsPanelOpen(true)
  }

  // ====================== ADD LEAD WITH AUTO LOG ======================
  const handleAddLead = async (data: { 
    name: string; 
    phone: string; 
    email: string; 
    budget: string; 
    vehicle: string 
  }) => {
    const newLeadId = `lead-${Date.now()}`

    const newLead: Lead = {
      id: newLeadId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      budget: parseInt(data.budget) || 25000,
      preferredVehicle: data.vehicle,
      stage: "new_lead",
      statuses: [],
      assignedRep: null,
      lastActivity: "Just now",
      downPayment: 0,
      location: "Unknown",
      creditStatus: "good",
      timeline: "Within 2 weeks",
      createdAt: new Date().toISOString(),
    }

    // Add to UI
    setLeads((prev) => [newLead, ...prev])
    setIsAddLeadOpen(false)

    setNotification({ message: `${data.name} added to New Lead`, type: 'success' })

    // Auto Workflow Log
    try {
      await createWorkflowLog(
        newLeadId,
        "Lead Created",
        `New lead "${data.name}" added manually`,
        "success"
      )
    } catch (e) {
      console.error("Log creation failed", e)
    }

    // Save to database
    try {
      await fetch('/api/leads', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TableName: "tbl_leads",
          Item: { ...newLead, lead_id: newLeadId }
        }),
      })
    } catch (err) {
      console.error("Database save failed", err)
    }
  }

  return (
    <div className="flex h-full flex-col relative">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3.5 rounded-xl shadow-xl text-sm font-medium ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="size-4" />
              Filter
              {activeFilter !== "all" && <Badge variant="secondary" className="ml-1 h-5 px-1.5">1</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuCheckboxItem checked={activeFilter === "all"} onCheckedChange={() => setActiveFilter("all")}>
              All Leads
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={activeFilter === "hot"} onCheckedChange={() => setActiveFilter("hot")}>
              Hot Leads Only
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={activeFilter === "deposit_pending"} onCheckedChange={() => setActiveFilter("deposit_pending")}>
              Deposit Pending
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={activeFilter === "assigned"} onCheckedChange={() => setActiveFilter("assigned")}>
              Assigned to Rep
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={activeFilter === "unassigned"} onCheckedChange={() => setActiveFilter("unassigned")}>
              Unassigned
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>Will be added to New Lead stage.</DialogDescription>
            </DialogHeader>
            <AddLeadForm onSubmit={handleAddLead} onCancel={() => setIsAddLeadOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex h-full gap-4 p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {PIPELINE_STAGES.map((stage) => (
              <KanbanColumn
                key={stage.id}
                id={stage.id}
                title={stage.name}
                leads={getLeadsForStage(stage.id)}
                onLeadClick={handleLeadClick}
              />
            ))}

            <DragOverlay>
              {activeId && leads.find((l) => l.id === activeId) && (
                <LeadCard lead={leads.find((l) => l.id === activeId)!} isDragging />
              )}
            </DragOverlay>
          </DndContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

// AddLeadForm (unchanged)
function AddLeadForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; phone: string; email: string; budget: string; vehicle: string }) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    email: "",
    budget: "",
    vehicle: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Customer Name</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Smith" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 123-4567" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@email.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="budget">Budget ($)</Label>
          <Input id="budget" type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} placeholder="25000" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="vehicle">Preferred Vehicle</Label>
          <Input id="vehicle" value={formData.vehicle} onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })} placeholder="Toyota Camry 2022" required />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Add Lead</Button>
      </DialogFooter>
    </form>
  )
}