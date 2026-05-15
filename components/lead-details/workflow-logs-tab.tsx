"use client"

import * as React from "react"
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

import { getWorkflowLogs } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface WorkflowLogsTabProps {
  leadId: string
}

export function WorkflowLogsTab({ leadId }: WorkflowLogsTabProps) {
  const [logs, setLogs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadLogs() {
      try {
        const allLogs = await getWorkflowLogs()
        // Filter logs for this lead
        const leadLogs = allLogs.filter((log: any) => log.leadId === leadId)
        setLogs(leadLogs)
      } catch (err) {
        console.error("Failed to load workflow logs:", err)
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [leadId])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading workflow logs...</div>
  }

  if (logs.length === 0) {
    return (
      <div className="p-12 text-center">
        <AlertTriangle className="mx-auto size-12 text-muted-foreground mb-4" />
        <h3 className="font-medium">No workflow logs yet</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Automation actions for this lead will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <h3 className="font-medium text-lg">Workflow Activity</h3>
      <div className="space-y-3">
        {logs.map((log, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {log.status === "success" && <CheckCircle className="size-5 text-green-600 mt-0.5" />}
                  {log.status === "failed" && <XCircle className="size-5 text-red-600 mt-0.5" />}
                  {log.status === "skipped" && <AlertTriangle className="size-5 text-yellow-600 mt-0.5" />}

                  <div>
                    <p className="font-medium">{log.workflowName}</p>
                    <p className="text-sm text-muted-foreground">{log.action}</p>
                  </div>
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {log.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {log.metadata && (
                <p className="mt-3 text-xs text-muted-foreground border-l-2 border-muted pl-3">
                  {log.metadata}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}