"use client"

import * as React from "react"
import { CheckCircle, XCircle, MinusCircle } from "lucide-react"

import { useCRM } from "@/lib/crm-context"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface WorkflowLogsTabProps {
  leadId: string
}

export function WorkflowLogsTab({ leadId }: WorkflowLogsTabProps) {
  const { workflowLogs } = useCRM()

  const leadLogs = workflowLogs.filter((log) => log.leadId === leadId)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Workflow Activity for this Lead</h3>

      {leadLogs.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
          No workflow logs for this lead yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Timestamp</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {log.workflowName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.triggerEvent.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.action.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={log.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: "success" | "skipped" | "failed" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-xs",
        status === "success" && "border-green-200 bg-green-50 text-green-700",
        status === "skipped" && "border-yellow-200 bg-yellow-50 text-yellow-700",
        status === "failed" && "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {status === "success" && <CheckCircle className="size-3" />}
      {status === "skipped" && <MinusCircle className="size-3" />}
      {status === "failed" && <XCircle className="size-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
