"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Phone, Car, Clock, User, Flame, Pause, MessageCircle, DollarSign } from "lucide-react"

import { Lead, getStatusColor, getStatusLabel, formatCurrency } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
  onClick?: () => void
}

const statusIcons: Record<string, React.ReactNode> = {
  hot: <Flame className="size-3" />,
  automation_paused: <Pause className="size-3" />,
  customer_replied: <MessageCircle className="size-3" />,
  deposit_paid: <DollarSign className="size-3" />,
}

export function LeadCard({ lead, isDragging, onClick }: LeadCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md active:scale-[0.985]",
        isDragging && "rotate-2 scale-105 shadow-lg opacity-90"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between">
          <h4 className="font-medium text-sm leading-tight line-clamp-1">{lead.name}</h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {lead.lastActivity}
          </span>
        </div>

        {/* Contact Info */}
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="size-3" />
          <span>{lead.phone}</span>
        </div>

        {/* Budget & Vehicle */}
        <div className="mb-3 flex items-center justify-between">
          <Badge variant="outline" className="font-medium">
            {formatCurrency(lead.budget)}
          </Badge>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Car className="size-3" />
            <span className="truncate max-w-[140px]">{lead.preferredVehicle}</span>
          </div>
        </div>

        {/* Status Badges */}
        {lead.statuses && lead.statuses.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {lead.statuses.map((status) => (
              <Badge
                key={status}
                variant="outline"
                className={cn("h-5 gap-1 text-xs", getStatusColor(status))}
              >
                {statusIcons[status]}
                {getStatusLabel(status)}
              </Badge>
            ))}
          </div>
        )}

        {/* Assigned Rep */}
        {lead.assignedRep && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="size-3" />
            <span>Rep: {lead.assignedRep}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SortableLeadCard({ lead, onClick }: { lead: Lead; onClick?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(isDragging && "opacity-50 z-50")}
    >
      <LeadCard 
        lead={lead} 
        isDragging={isDragging} 
        onClick={onClick} 
      />
    </div>
  )
}