"use client"

import * as React from "react"
import {
  Search,
  Filter,
  Download,
  Trash2,
  Play,
  Database,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  RefreshCw,
} from "lucide-react"

import { useCRM } from "@/lib/crm-context"
import { mockScheduledJobs } from "@/lib/crm-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function WorkflowConsoleContent() {
  const { workflowLogs, addWorkflowLog, clearWorkflowLogs, leads, setLeads } = useCRM()
  const [searchLeadId, setSearchLeadId] = React.useState("")
  const [filterWorkflow, setFilterWorkflow] = React.useState<string>("all")
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const [isRunningTest, setIsRunningTest] = React.useState(false)

  // Get unique workflow names
  const workflowNames = React.useMemo(() => {
    const names = new Set(workflowLogs.map((log) => log.workflowName))
    return Array.from(names)
  }, [workflowLogs])

  // Filter logs
  const filteredLogs = React.useMemo(() => {
    return workflowLogs.filter((log) => {
      if (searchLeadId && !log.leadId.toLowerCase().includes(searchLeadId.toLowerCase())) {
        return false
      }
      if (filterWorkflow !== "all" && log.workflowName !== filterWorkflow) {
        return false
      }
      if (filterStatus !== "all" && log.status !== filterStatus) {
        return false
      }
      return true
    })
  }, [workflowLogs, searchLeadId, filterWorkflow, filterStatus])

  const handleSeedDemoData = () => {
    const demoLogs = [
      {
        leadId: "lead-001",
        timestamp: new Date().toISOString(),
        workflowName: "Welcome Sequence",
        triggerEvent: "lead_created",
        action: "send_welcome_email",
        status: "success" as const,
        metadata: '{"template": "welcome_v3"}',
      },
      {
        leadId: "lead-002",
        timestamp: new Date(Date.now() - 60000).toISOString(),
        workflowName: "Follow-up Scheduler",
        triggerEvent: "no_response_24h",
        action: "schedule_followup",
        status: "success" as const,
        metadata: '{"delay": "24h"}',
      },
      {
        leadId: "lead-003",
        timestamp: new Date(Date.now() - 120000).toISOString(),
        workflowName: "Hot Lead Alert",
        triggerEvent: "budget_threshold_met",
        action: "notify_sales_team",
        status: "skipped" as const,
        metadata: '{"reason": "already_notified"}',
      },
    ]

    demoLogs.forEach((log) => addWorkflowLog(log))
  }

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", "workflow-logs.json")
    linkElement.click()
  }

  const handleRunTestSimulation = () => {
    setIsRunningTest(true)

    // Simulate workflow test
    const testSteps = [
      {
        leadId: "test-lead",
        workflowName: "Test Simulation",
        triggerEvent: "manual_test",
        action: "validate_trigger",
        status: "success" as const,
        metadata: '{"step": 1}',
      },
      {
        leadId: "test-lead",
        workflowName: "Test Simulation",
        triggerEvent: "validation_passed",
        action: "execute_action",
        status: "success" as const,
        metadata: '{"step": 2}',
      },
      {
        leadId: "test-lead",
        workflowName: "Test Simulation",
        triggerEvent: "action_complete",
        action: "log_result",
        status: "success" as const,
        metadata: '{"step": 3, "result": "passed"}',
      },
    ]

    let index = 0
    const interval = setInterval(() => {
      if (index < testSteps.length) {
        addWorkflowLog({
          ...testSteps[index],
          timestamp: new Date().toISOString(),
        })
        index++
      } else {
        clearInterval(interval)
        setIsRunningTest(false)
      }
    }, 800)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflow Console</h1>
          <p className="text-muted-foreground">
            Monitor and debug automation workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSeedDemoData}>
            <Database className="mr-1.5 size-4" />
            Seed Demo Data
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="mr-1.5 size-4" />
                Clear Logs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all workflow logs?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All workflow logs will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearWorkflowLogs}>Clear Logs</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="sm" onClick={handleExportLogs}>
            <Download className="mr-1.5 size-4" />
            Export JSON
          </Button>
          <Button size="sm" onClick={handleRunTestSimulation} disabled={isRunningTest}>
            {isRunningTest ? (
              <>
                <RefreshCw className="mr-1.5 size-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-1.5 size-4" />
                Run Test Simulation
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Event Log Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Event Log</CardTitle>
            <CardDescription>Real-time workflow activity viewer</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter by Lead ID..."
                  value={searchLeadId}
                  onChange={(e) => setSearchLeadId(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
              <Select value={filterWorkflow} onValueChange={setFilterWorkflow}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Workflow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workflows</SelectItem>
                  {workflowNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[140px]">Timestamp</TableHead>
                    <TableHead className="w-[100px]">Lead ID</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="w-[90px]">Status</TableHead>
                    <TableHead>Metadata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No workflow logs found. Try adjusting your filters or seed demo data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {new Date(log.timestamp).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{log.leadId}</TableCell>
                        <TableCell className="text-sm font-medium">{log.workflowName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.triggerEvent.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.action.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell className="max-w-[120px]">
                          <code className="text-xs text-muted-foreground truncate block">
                            {log.metadata}
                          </code>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Scheduled Jobs Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Scheduled Jobs
            </CardTitle>
            <CardDescription>Upcoming automated tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockScheduledJobs.map((job) => (
                <div
                  key={job.id}
                  className={cn(
                    "rounded-lg border p-3",
                    job.status === "completed" && "bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        job.status === "pending" && "border-amber-200 bg-amber-50 text-amber-700",
                        job.status === "completed" && "border-green-200 bg-green-50 text-green-700",
                        job.status === "cancelled" && "border-red-200 bg-red-50 text-red-700"
                      )}
                    >
                      {job.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(job.runAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{job.jobType}</p>
                  <p className="text-xs text-muted-foreground font-mono">{job.leadId}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
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
      {status}
    </Badge>
  )
}
