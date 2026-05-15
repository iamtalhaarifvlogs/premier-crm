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
} from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

import { PIPELINE_STAGES, formatCurrency } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  // Calculate metrics
  const totalLeads = leads.length
  const hotLeads = leads.filter((l) => l.statuses?.includes("hot")).length
  const depositsPending = leads.filter(
    (l) => l.stage === "deposit_requested" && !l.statuses?.includes("deposit_paid")
  ).length
  const depositsPaid = leads.filter((l) => l.statuses?.includes("deposit_paid")).length
  const repHandoffsToday = leads.filter((l) => l.stage === "rep_handoff").length
  const coldLeads = leads.filter(
    (l) =>
      (l.stage === "closed_lost" || l.lastActivity?.includes("d")) &&
      !l.statuses?.includes("hot")
  ).length

  // Chart data - leads per stage
  const leadsPerStageData = PIPELINE_STAGES.map((stage) => ({
    name: stage.name.split(" ").slice(0, 2).join(" "),
    fullName: stage.name,
    count: leads.filter((l) => l.stage === stage.id).length,
  }))

  // Chart data - follow-ups over time (mock for now)
  const followUpsData = [
    { day: "Mon", followUps: 12 },
    { day: "Tue", followUps: 19 },
    { day: "Wed", followUps: 15 },
    { day: "Thu", followUps: 22 },
    { day: "Fri", followUps: 18 },
    { day: "Sat", followUps: 8 },
    { day: "Sun", followUps: 5 },
  ]

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your vehicle sales CRM performance
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-600 text-red-700 px-6 py-4 rounded-2xl text-center font-medium">
          ❌ {error}
          <p className="text-sm mt-2 text-red-600">
            Make sure the proxy route (`app/api/crm/[table]/route.ts`) is deployed correctly.
          </p>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          title="Deposits Pending"
          value={depositsPending}
          icon={Clock}
          iconColor="text-amber-500"
        />
        <MetricCard
          title="Deposits Paid"
          value={depositsPaid}
          icon={DollarSign}
          iconColor="text-green-500"
          trend="+8%"
          trendUp
        />
        <MetricCard
          title="Rep Handoffs Today"
          value={repHandoffsToday}
          icon={UserCheck}
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Cold / Inactive"
          value={coldLeads}
          icon={AlertTriangle}
          iconColor="text-red-500"
          trend="-3%"
          trendUp={false}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads per Stage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Leads per Stage</CardTitle>
            <CardDescription>
              Distribution of leads across pipeline stages
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
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsPerStageData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ fill: "hsl(var(--muted))" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Follow-ups Over Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Follow-ups Triggered</CardTitle>
            <CardDescription>
              Automated follow-up messages sent this week
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={followUpsData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="followUps"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Pipeline Activity</CardTitle>
          <CardDescription>Latest lead movements and status changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leads.slice(0, 5).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {PIPELINE_STAGES.find((s) => s.id === lead.stage)?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatCurrency(lead.budget)}</p>
                  <p className="text-xs text-muted-foreground">{lead.lastActivity}</p>
                </div>
              </div>
            ))}

            {leads.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No leads available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

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
          <div className={cn("rounded-lg bg-muted p-2", iconColor)}>
            <Icon className="size-4" />
          </div>
          {trend && (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                trendUp ? "text-green-600" : "text-red-600"
              )}
            >
              {trendUp ? (
                <TrendingUp className="mr-0.5 size-3" />
              ) : (
                <TrendingDown className="mr-0.5 size-3" />
              )}
              {trend}
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}