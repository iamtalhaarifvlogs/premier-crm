"use client"

import * as React from "react"
import { X, Save, Edit2, Flame, CheckCircle } from "lucide-react"

import { useCRM } from "@/lib/crm-context"
import { Lead, PIPELINE_STAGES, getStatusColor, getStatusLabel } from "@/lib/mock-data"
import { createWorkflowLog } from "@/lib/mock-data"
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
  const