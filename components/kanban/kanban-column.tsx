"use client"

import * as React from "react"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import { Lead, PipelineStage } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SortableLeadCard } from "./lead-card"

interface KanbanColumnProps {
  id: PipelineStage
  title: string
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}

const stageColors: Record<PipelineStage, string> = {
  new_lead: "bg-blue-500",
  maya_qualification: "bg-purple-500",
  vehicle_sourcing: "bg-indigo-500",
  alternatives_presented: "bg-cyan-500",
  deposit_requested: "bg-amber-500",
  deposit_paid: "bg-emerald-500",
  rep_handoff: "bg-orange-500",
  closed_won: "bg-green-600",
  closed_lost: "bg-red-500",
}

export function KanbanColumn({ id, title, leads, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-[calc(100vh-12rem)] w-[280px] flex-shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors",
        isOver && "border-primary bg-muted/50"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b bg-background/50 p-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className={cn("size-2.5 rounded-full", stageColors[id])} />
          <h3 className="font-medium">{title}</h3>
        </div>
        <Badge variant="secondary" className="h-5 px-2 text-xs font-mono">
          {leads.length}
        </Badge>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 p-3">
        <SortableContext
          items={leads.map((lead) => lead.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2 min-h-[100px]">
            {leads.length > 0 ? (
              leads.map((lead) => (
                <SortableLeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onLeadClick(lead)}
                />
              ))
            ) : (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 text-sm text-muted-foreground">
                No leads in this stage
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  )
}