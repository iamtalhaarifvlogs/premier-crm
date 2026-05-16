"use client"

import * as React from "react"
import { Plus, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react"

import { getWorkflowLogs } from "@/lib/mock-data"
import { useCRM } from "@/lib/crm-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface WorkflowLogsTabProps {
  leadId: string
}

export function WorkflowLogsTab({ leadId }: WorkflowLogsTabProps) {
  const { leads } = useCRM()
  const [logs, setLogs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [newLog, setNewLog] = React.useState({
    workflowName: "",
    action: "",
    status: "success" as "success" | "failed" | "skipped"
  })

  const loadLogs = async () => {
    try {
      const allLogs = await getWorkflowLogs()
      const leadLogs = allLogs.filter((log: any) => 
        log.leadId === leadId || log.lead_id === leadId
      )
      setLogs(leadLogs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadLogs()
  }, [leadId])

  const handleAddLog = async () => {
    if (!newLog.workflowName) return

    const logEntry = {
      TableName: "tbl_workflow_logs",
      Item: {
        lead_id: leadId,
        timestamp: new Date().toISOString(),
        workflowName: newLog.workflowName,
        action: newLog.action || "Manual log",
        status: newLog.status,
      }
    }

    try {
      const response = await fetch('/api/leads', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logEntry),
      })

      if (response.ok) {
        await loadLogs() // refresh
        setNewLog({ workflowName: "", action: "", status: "success" })
        setShowAddForm(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading logs...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">Workflow Logs ({logs.length})</h3>
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
          <Plus className="size-4 mr-2" />
          Add Log
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label>Workflow Name</Label>
              <Input 
                value={newLog.workflowName}
                onChange={(e) => setNewLog({...newLog, workflowName: e.target.value})}
                placeholder="e.g. Qualification Complete"
              />
            </div>
            <div>
              <Label>Action / Details</Label>
              <Input 
                value={newLog.action}
                onChange={(e) => setNewLog({...newLog, action: e.target.value})}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={newLog.status} onValueChange={(v) => setNewLog({...newLog, status: v as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddLog} className="flex-1">Add Log</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No workflow logs yet</p>
        ) : (
          logs.map((log, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div className="flex items-center gap-3">
                    {log.status === "success" && <CheckCircle className="text-green-600" />}
                    {log.status === "failed" && <XCircle className="text-red-600" />}
                    {log.status === "skipped" && <AlertTriangle className="text-yellow-600" />}
                    <div>
                      <p className="font-medium">{log.workflowName}</p>
                      {log.action && <p className="text-sm text-muted-foreground">{log.action}</p>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}