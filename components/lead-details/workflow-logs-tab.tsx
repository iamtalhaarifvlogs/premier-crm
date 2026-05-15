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
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadLogs() {
      try {
        console.log(`Loading workflow logs for lead: ${leadId}`)
        const allLogs = await getWorkflowLogs()
        
        console.log(`Total workflow logs received: ${allLogs.length}`)

        // More flexible matching
        const leadLogs = allLogs.filter((log: any) => {
          const logLeadId = log.leadId || log.lead_id || log.leadID
          return logLeadId === leadId || logLeadId === `lead-${leadId}`
        })

        console.log(`Logs found for this lead: ${leadLogs.length}`)

        setLogs(leadLogs)
      } catch (err: any) {
        console.error("Failed to load workflow logs:", err)
        setError(err.message || "Failed to load logs")
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [leadId])

  if (loading) {
    return <div className="p-12 text-center">Loading workflow logs...</div>
  }

  if (error) {
    return (
      <div className="p-12 text-center text-red-600">
        Error: {error}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="p-12 text-center">
        <AlertTriangle className="mx-auto size-12 text-muted-foreground mb-4" />
        <h3 className="font-medium">No workflow logs yet</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Automation actions for this lead will appear here once they run.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <h3 className="font-medium text-lg flex items-center gap-2">
        Workflow Activity ({logs.length})
      </h3>

      <div className="space-y-3">
        {logs.map((log, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {log.status === "success" && <CheckCircle className="size-5 text-green-600 mt-0.5" />}
                  {log.status === "failed" && <XCircle className="size-5 text-red-600 mt-0.5" />}
                  {log.status === "skipped" && <AlertTriangle className="size-5 text-yellow-600 mt-0.5" />}

                  <div>
                    <p className="font-medium">{log.workflowName || "Workflow Action"}</p>
                    <p className="text-sm text-muted-foreground">{log.action}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {log.status}
                  </Badge>
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