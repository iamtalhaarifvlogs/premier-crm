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
  DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, Search, Filter, Flame, Clock, UserCheck, DollarSign, CircleDot } from "lucide-react"

import { useCRM } from "@/lib/crm-context"
import {
  Lead,
  PipelineStage,
  PIPELINE_STAGES,
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  getLeads,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"
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
        lead.email?.toLowerCase().includes(query) ||
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

  // ====================== ADD NEW LEAD WITH API ======================
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

    try {
      // Send to AWS Lambda
      const response = await fetch(
        "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            TableName: "tbl_leads",
            Item: {
              lead_id: newLeadId,
              name: newLead.name,
              phone: newLead.phone,
              email: newLead.email,
              budget: newLead.budget,
              preferredVehicle: newLead.preferredVehicle,
              stage: newLead.stage,
              statuses: newLead.statuses,
              assignedRep: newLead.assignedRep,
              lastActivity: newLead.lastActivity,
              downPayment: newLead.downPayment,
              location: newLead.location,
              creditStatus: newLead.creditStatus,
              timeline: newLead.timeline,
              createdAt: newLead.createdAt,
            },
          }),
        }
      )

      if (!response.ok) {
        const err = await response.text()
        throw new Error(err)
      }

      console.log("✅ Lead saved to database successfully")

      // Update local state
      setLeads((prev) => [newLead, ...prev])
      setIsAddLeadOpen(false)

    } catch (err: any) {
      console.error("Failed to save lead to database:", err)
      alert("Failed to save lead to database. It was added locally only.")
      setLeads((prev) => [newLead, ...prev])
      setIsAddLeadOpen(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar - same as before */}
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        {/* ... your existing toolbar code ... */}
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
              <DialogDescription>Will be saved to the database.</DialogDescription>
            </DialogHeader>
            <AddLeadForm onSubmit={handleAddLead} onCancel={() => setIsAddLeadOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Rest of your Kanban board remains the same */}
      {/* ... */}
    </div>
  )
}

// Keep your existing AddLeadForm (unchanged)
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
        <Button type="submit">Add Lead to Database</Button>
      </DialogFooter>
    </form>
  )
}