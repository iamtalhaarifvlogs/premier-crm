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
import { 
  getWorkflowLogs, 
  getScheduledJobs,
  createWorkflowLog 
} from "@/lib/mock-data"
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
  const { leads, workflowLogs: contextLogs, addWorkflowLog, clearWorkflowLogs } = useCRM()

  const [realWorkflowLogs, setRealWorkflowLogs] = React.useState<any[]>([])
  const [scheduledJobs, setScheduledJobs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchLeadId, setSearchLeadId] = React.useState("")
  const [filterWorkflow, setFilterWorkflow] = React.useState<string>("all")
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const [isRunningTest, setIsRunningTest] = React.useState(false)

  // Load real data from AWS
  const loadRealData = async () => {
    setLoading(true)
    try {
      const [logs, jobs] = await Promise.all([
        getWorkflowLogs(),
        getScheduledJobs()
      ])

      setRealWorkflowLogs(logs)
      setScheduledJobs(jobs)
    } catch (err) {
      console.error("Failed to load real workflow data:", err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadRealData()
  }, [])

  // Combine real logs + context logs and enrich with lead name
  const allLogs = React.useMemo(() => {
    const combined = [...realWorkflowLogs, ...contextLogs]

    return combined.map(log => {
      const lead = leads.find(l => l.id === log.leadId || l.id === log.lead_id)
      return {
        ...log,
        leadName: lead?.name || "Unknown Lead",
        displayLeadId: log.leadId || log.lead_id || "N/A"
      }
    })
  }, [realWorkflowLogs, contextLogs, leads])

  // Get unique workflow names
  const workflowNames = React.useMemo(() => {
    const names = new Set(allLogs.map((log) => log.workflowName))
    return Array.from(names)
  }, [allLogs])

  // Filtered logs
  const filteredLogs = React.useMemo(() => {
    return allLogs.filter((log) => {
      if (searchLeadId && 
          !log.displayLeadId.toLowerCase().includes(searchLeadId.toLowerCase()) && 
          !log.leadName.toLowerCase().includes(searchLeadId.toLowerCase())) {
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
  }, [allLogs, searchLeadId, filterWorkflow, filterStatus])

  const handleSeedDemoData = () => {
    // You can keep or remove this
    alert("Demo data seeding is now handled automatically via actions.")
  }

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", `workflow-logs-${new Date().toISOString().slice(0,10)}.json`)
    linkElement.click()
  }

  const handleRunTestSimulation = () => {
    setIsRunningTest(true)

    const testLeadId = "test-lead-" + Date.now()

    const testSteps = [
      { workflowName: "Test Simulation", action: "validate_trigger", status: "success" as const },
      { workflowName: "Test Simulation", action: "execute_action", status: "success" as const },
      { workflowName: "Test Simulation", action: "log_result", status: "success" as const },
    ]

    let index = 0
    const interval = setInterval(() => {
      if (index < testSteps.length) {
        const step = testSteps[index]
        addWorkflowLog({
          leadId: testLeadId,
          timestamp: new Date().toISOString(),
          workflowName: step.workflowName,
          action: step.action,
          status: step.status,
        })
        index++
      } else {
        clearInterval(interval)
        setIsRunningTest(false)
        loadRealData() // refresh real logs
      }
    }, 800)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflow Console</h1>
          <p className="text-muted-foreground">Real-time automation monitoring • {allLogs.length} events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadRealData}>
            <RefreshCw className="mr-1.5 size-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportLogs}>
            <Download className="mr-1.5 size-4" />
            Export
          </Button>
          <Button size="sm" onClick={handleRunTestSimulation} disabled={isRunningTest}>
            {isRunningTest ? "Running..." : "Run Test"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Event Log */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Event Log</CardTitle>
            <CardDescription>Live workflow activity with lead names</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by Lead ID or Name..."
                  value={searchLeadId}
                  onChange={(e) => setSearchLeadId(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterWorkflow} onValueChange={setFilterWorkflow}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All Workflows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workflows</SelectItem>
                  {workflowNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[520px] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                        No matching logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString([], { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.leadName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{log.displayLeadId}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{log.workflowName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.action}</TableCell>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Scheduled Jobs Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Scheduled Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduledJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No scheduled jobs at the moment
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledJobs.map((job, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex justify-between">
                      <p className="font-medium">{job.jobType}</p>
                      <Badge>{job.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{job.leadId}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(job.runAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        status === "success" && "border-green-200 bg-green-50 text-green-700",
        status === "skipped" && "border-yellow-200 bg-yellow-50 text-yellow-700",
        status === "failed" && "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {status === "success" && <CheckCircle className="mr-1 size-3" />}
      {status === "skipped" && <MinusCircle className="mr-1 size-3" />}
      {status === "failed" && <XCircle className="mr-1 size-3" />}
      {status}
    </Badge>
  )
}