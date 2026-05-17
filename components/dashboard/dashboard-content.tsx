"use client"

import * as React from "react"
import {
  Users,
  Flame,
  Clock,
  DollarSign,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Brain,
  Activity,
  Car,
  Target,
} from "lucide-react"

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"

import {
  PIPELINE_STAGES,
  formatCurrency,
} from "@/lib/mock-data"

import { cn } from "@/lib/utils"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface DashboardContentProps {
  leads: any[]
  messages?: Record<string, any[]>
  workflowLogs?: any[]
  stageHistory?: Record<string, any[]>
  vehicleMatches?: any[]
  error: string | null
}

export function DashboardContent({
  leads = [],
  messages = {},
  workflowLogs = [],
  stageHistory = {},
  vehicleMatches = [],
  error,
}: DashboardContentProps) {
  /*
  |--------------------------------------------------------------------------
  | METRICS
  |--------------------------------------------------------------------------
  */

  const totalLeads = leads.length

  const hotLeads = leads.filter((lead) =>
    lead.statuses?.includes("hot")
  ).length

  const depositsPending = leads.filter(
    (lead) =>
      lead.stage === "deposit_requested" &&
      !lead.statuses?.includes("deposit_paid")
  ).length

  const depositsPaid = leads.filter((lead) =>
    lead.statuses?.includes("deposit_paid")
  ).length

  const repHandoffsToday = leads.filter((lead) =>
    lead.statuses?.includes("rep_handoff")
  ).length

  const coldLeads = leads.filter(
    (lead) =>
      lead.stage === "closed_lost" ||
      lead.statuses?.includes("inactive")
  ).length

  const qualifiedLeads = leads.filter(
    (lead) =>
      lead.statuses?.includes("qualified") ||
      lead.stage === "qualified"
  ).length

  const sourcingLeads = leads.filter(
    (lead) => lead.stage === "vehicle_sourcing"
  ).length

  const totalRevenue = leads
    .filter((lead) =>
      lead.statuses?.includes("deposit_paid")
    )
    .reduce(
      (acc, lead) => acc + (lead.budget || 0),
      0
    )

  /*
  |--------------------------------------------------------------------------
  | LEADS PER STAGE
  |--------------------------------------------------------------------------
  */

  const leadsPerStageData = PIPELINE_STAGES.map((stage) => ({
    name: stage.name.split(" ").slice(0, 2).join(" "),
    fullName: stage.name,
    count: leads.filter(
      (lead) => lead.stage === stage.id
    ).length,
  }))

  /*
  |--------------------------------------------------------------------------
  | FOLLOW UPS
  |--------------------------------------------------------------------------
  */

  const followUpsData = [
    { day: "Mon", followUps: 12 },
    { day: "Tue", followUps: 18 },
    { day: "Wed", followUps: 16 },
    { day: "Thu", followUps: 24 },
    { day: "Fri", followUps: 19 },
    { day: "Sat", followUps: 9 },
    { day: "Sun", followUps: 6 },
  ]

  /*
  |--------------------------------------------------------------------------
  | LEAD PRIORITY DISTRIBUTION
  |--------------------------------------------------------------------------
  */

  const priorityData = [
    {
      name: "Hot",
      value: hotLeads,
      color: "#f97316",
    },
    {
      name: "Qualified",
      value: qualifiedLeads,
      color: "#22c55e",
    },
    {
      name: "Cold",
      value: coldLeads,
      color: "#ef4444",
    },
  ]

  /*
  |--------------------------------------------------------------------------
  | RECENT WORKFLOW EVENTS
  |--------------------------------------------------------------------------
  */

  const recentWorkflowLogs = workflowLogs
    ?.slice(0, 6)
    ?.reverse()

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          CRM Dashboard
        </h1>

        <p className="text-muted-foreground">
          AI-powered vehicle sales pipeline overview
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-2xl border border-red-500 bg-red-50 px-5 py-4">
          <p className="font-semibold text-red-600">
            CRM Connection Error
          </p>

          <p className="mt-1 text-sm text-red-500">
            {error}
          </p>

          <p className="mt-2 text-xs text-red-400">
            Verify your API route:
            <code className="ml-1 rounded bg-red-100 px-1 py-0.5">
              app/api/crm/[table]/route.ts
            </code>
          </p>
        </div>
      )}

      {/* METRICS */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <MetricCard
          title="Total Leads"
          value={totalLeads}
          icon={Users}
          trend="+12%"
          trendUp
        />

        <MetricCard
          title="Hot Leads"
          value={hotLeads}
          icon={Flame}
          iconColor="text-orange-500"
          trend="+5%"
          trendUp
        />

        <MetricCard
          title="Qualified"
          value={qualifiedLeads}
          icon={Target}
          iconColor="text-green-500"
        />

        <MetricCard
          title="Vehicle Sourcing"
          value={sourcingLeads}
          icon={Car}
          iconColor="text-blue-500"
        />

        <MetricCard
          title="Deposits Pending"
          value={depositsPending}
          icon={Clock}
          iconColor="text-amber-500"
        />

        <MetricCard
          title="Deposits Paid"
          value={depositsPaid}
          icon={DollarSign}
          iconColor="text-emerald-500"
          trend="+8%"
          trendUp
        />

        <MetricCard
          title="Rep Handoffs"
          value={repHandoffsToday}
          icon={UserCheck}
          iconColor="text-cyan-500"
        />

        <MetricCard
          title="Cold Leads"
          value={coldLeads}
          icon={AlertTriangle}
          iconColor="text-red-500"
          trend="-3%"
          trendUp={false}
        />
      </div>

      {/* AI INSIGHTS */}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Leads Per Pipeline Stage
            </CardTitle>

            <CardDescription>
              Current lead distribution across CRM stages
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Leads",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[320px]"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={leadsPerStageData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 11 }}
                    height={60}
                  />

                  <YAxis tick={{ fontSize: 12 }} />

                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />

                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* PRIORITY */}

        <Card>
          <CardHeader>
            <CardTitle>
              Lead Priority
            </CardTitle>

            <CardDescription>
              AI lead classification overview
            </CardDescription>
          </CardHeader>

          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <PieChart>
                <Pie
                  data={priorityData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {priorityData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                    />
                  ))}
                </Pie>

                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* FOLLOW UPS + REVENUE */}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Follow-ups Triggered
            </CardTitle>

            <CardDescription>
              Automated Maya engagement activity
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ChartContainer
              config={{
                followUps: {
                  label: "Follow-ups",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={followUpsData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis tick={{ fontSize: 12 }} />

                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />

                  <Line
                    type="monotone"
                    dataKey="followUps"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* AI REVENUE CARD */}

        <Card>
          <CardHeader>
            <CardTitle>
              AI Revenue Overview
            </CardTitle>

            <CardDescription>
              Closed revenue and automation performance
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-2xl border p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <DollarSign className="size-5 text-primary" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Closed Revenue
                  </p>

                  <h2 className="text-3xl font-bold">
                    {formatCurrency(totalRevenue)}
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Brain className="size-4 text-primary" />

                  <p className="text-sm font-medium">
                    AI Workflows
                  </p>
                </div>

                <p className="mt-3 text-2xl font-bold">
                  {workflowLogs.length}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-primary" />

                  <p className="text-sm font-medium">
                    Vehicle Matches
                  </p>
                </div>

                <p className="mt-3 text-2xl font-bold">
                  {vehicleMatches.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECENT LEADS */}

      <Card>
        <CardHeader>
          <CardTitle>
            Recent Pipeline Activity
          </CardTitle>

          <CardDescription>
            Latest lead movements and AI actions
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {leads.slice(0, 6).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between rounded-xl border p-4 transition hover:bg-muted/40"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
                    <Users className="size-5 text-primary" />
                  </div>

                  <div>
                    <p className="font-medium">
                      {lead.name}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {
                        PIPELINE_STAGES.find(
                          (stage) =>
                            stage.id === lead.stage
                        )?.name
                      }
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(lead.budget)}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {lead.lastActivity}
                  </p>
                </div>
              </div>
            ))}

            {leads.length === 0 && !error && (
              <div className="py-12 text-center text-muted-foreground">
                No leads available yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* WORKFLOW LOGS */}

      <Card>
        <CardHeader>
          <CardTitle>
            Maya Workflow Logs
          </CardTitle>

          <CardDescription>
            Recent AI automation activity
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {recentWorkflowLogs?.length ? (
              recentWorkflowLogs.map(
                (log: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-xl border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {log.action || "Workflow Event"}
                      </p>

                      <span className="text-xs text-muted-foreground">
                        {log.timestamp || "Now"}
                      </span>
                    </div>

                    {log.message && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {log.message}
                      </p>
                    )}
                  </div>
                )
              )
            ) : (
              <p className="py-6 text-center text-muted-foreground">
                No workflow activity yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| METRIC CARD
|--------------------------------------------------------------------------
*/

interface MetricCardProps {
  title: string
  value: number | string
  icon: React.ElementType
  iconColor?: string
  trend?: string
  trendUp?: boolean
}

function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  trendUp,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "rounded-xl bg-muted p-2",
              iconColor
            )}
          >
            <Icon className="size-4" />
          </div>

          {trend && (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                trendUp
                  ? "text-green-600"
                  : "text-red-600"
              )}
            >
              {trendUp ? (
                <TrendingUp className="mr-1 size-3" />
              ) : (
                <TrendingDown className="mr-1 size-3" />
              )}

              {trend}
            </span>
          )}
        </div>

        <div className="mt-4">
          <p className="text-2xl font-bold">
            {value}
          </p>

          <p className="text-xs text-muted-foreground">
            {title}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}