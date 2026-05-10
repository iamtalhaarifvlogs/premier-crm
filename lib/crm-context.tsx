"use client"

import * as React from "react"
import { Lead, PipelineStage, mockLeads as initialMockLeads, mockMessages, mockWorkflowLogs as initialWorkflowLogs, mockStageHistory, mockVehicleMatches, mockScheduledJobs } from "./mock-data"

interface CRMContextType {
  leads: Lead[]
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>
  moveLeadToStage: (leadId: string, newStage: PipelineStage) => void
  selectedLead: Lead | null
  setSelectedLead: (lead: Lead | null) => void
  isDetailsPanelOpen: boolean
  setIsDetailsPanelOpen: (open: boolean) => void
  workflowLogs: typeof initialWorkflowLogs
  addWorkflowLog: (log: Omit<typeof initialWorkflowLogs[0], "id">) => void
  clearWorkflowLogs: () => void
  settings: {
    mayaAutomation: boolean
    followUpScheduling: boolean
    killSwitch: boolean
  }
  updateSettings: (settings: Partial<CRMContextType["settings"]>) => void
  resetDemoData: () => void
}

const CRMContext = React.createContext<CRMContextType | null>(null)

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = React.useState<Lead[]>(initialMockLeads)
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = React.useState(false)
  const [workflowLogs, setWorkflowLogs] = React.useState(initialWorkflowLogs)
  const [settings, setSettings] = React.useState({
    mayaAutomation: true,
    followUpScheduling: true,
    killSwitch: false,
  })

  const moveLeadToStage = React.useCallback((leadId: string, newStage: PipelineStage) => {
    setLeads(prev => 
      prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, stage: newStage, lastActivity: "Just now" }
          : lead
      )
    )
  }, [])

  const addWorkflowLog = React.useCallback((log: Omit<typeof initialWorkflowLogs[0], "id">) => {
    const newLog = {
      ...log,
      id: `wf-${Date.now()}`,
    }
    setWorkflowLogs(prev => [newLog, ...prev])
  }, [])

  const clearWorkflowLogs = React.useCallback(() => {
    setWorkflowLogs([])
  }, [])

  const updateSettings = React.useCallback((newSettings: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  const resetDemoData = React.useCallback(() => {
    setLeads(initialMockLeads)
    setWorkflowLogs(initialWorkflowLogs)
    setSelectedLead(null)
    setIsDetailsPanelOpen(false)
    setSettings({
      mayaAutomation: true,
      followUpScheduling: true,
      killSwitch: false,
    })
  }, [])

  const value = React.useMemo(() => ({
    leads,
    setLeads,
    moveLeadToStage,
    selectedLead,
    setSelectedLead,
    isDetailsPanelOpen,
    setIsDetailsPanelOpen,
    workflowLogs,
    addWorkflowLog,
    clearWorkflowLogs,
    settings,
    updateSettings,
    resetDemoData,
  }), [leads, selectedLead, isDetailsPanelOpen, workflowLogs, settings, moveLeadToStage, addWorkflowLog, clearWorkflowLogs, updateSettings, resetDemoData])

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  )
}

export function useCRM() {
  const context = React.useContext(CRMContext)
  if (!context) {
    throw new Error("useCRM must be used within a CRMProvider")
  }
  return context
}

export { mockMessages, mockStageHistory, mockVehicleMatches, mockScheduledJobs }
