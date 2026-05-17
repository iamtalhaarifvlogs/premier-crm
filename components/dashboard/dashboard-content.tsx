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
  Lock,
  Mail,
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
  | LOGIN STATE
  |--------------------------------------------------------------------------
  */

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loginError, setLoginError] =
    React.useState("")
  const [isAuthenticated, setIsAuthenticated] =
    React.useState(false)

  const handleLogin = (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (
      email === "john@gmail.com" &&
      password === "1234"
    ) {
      setIsAuthenticated(true)
      setLoginError("")
      return
    }

    setLoginError(
      "Invalid email or password."
    )
  }

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
      !lead.statuses?.includes(
        "deposit_paid"
      )
  ).length

  const depositsPaid = leads.filter((lead) =>
    lead.statuses?.includes(
      "deposit_paid"
    )
  ).length

  const repHandoffsToday = leads.filter(
    (lead) =>
      lead.statuses?.includes(
        "rep_handoff"
      )
  ).length

  const coldLeads = leads.filter(
    (lead) =>
      lead.stage === "closed_lost" ||
      lead.statuses?.includes("inactive")
  ).length

  const qualifiedLeads = leads.filter(
    (lead) =>
      lead.statuses?.includes(
        "qualified"
      ) || lead.stage === "qualified"
  ).length

  const sourcingLeads = leads.filter(
    (lead) =>
      lead.stage === "vehicle_sourcing"
  ).length

  const totalRevenue = leads
    .filter((lead) =>
      lead.statuses?.includes(
        "deposit_paid"
      )
    )
    .reduce(
      (acc, lead) =>
        acc + (lead.budget || 0),
      0
    )

  /*
  |--------------------------------------------------------------------------
  | CHART DATA
  |--------------------------------------------------------------------------
  */

  const leadsPerStageData =
    PIPELINE_STAGES.map((stage) => ({
      name: stage.name
        .split(" ")
        .slice(0, 2)
        .join(" "),
      fullName: stage.name,
      count: leads.filter(
        (lead) =>
          lead.stage === stage.id
      ).length,
    }))

  const followUpsData = [
    { day: "Mon", followUps: 12 },
    { day: "Tue", followUps: 18 },
    { day: "Wed", followUps: 16 },
    { day: "Thu", followUps: 24 },
    { day: "Fri", followUps: 19 },
    { day: "Sat", followUps: 9 },
    { day: "Sun", followUps: 6 },
  ]

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

  const recentWorkflowLogs =
    workflowLogs
      ?.slice(0, 6)
      ?.reverse() || []

  return (
    <div className="relative min-h-screen">
      {/* LOGIN OVERLAY */}

      {!isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="w-full max-w-md rounded-3xl border bg-background shadow-2xl">
            <div className="p-8">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="mb-4 rounded-2xl bg-primary/10 p-4">
                  <Lock className="size-8 text-primary" />
                </div>

                <h2 className="text-3xl font-bold">
                  CRM Login
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Login to access the dashboard
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 size-4 text-muted-foreground" />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      placeholder="Enter email"
                      className="h-12 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 size-4 text-muted-foreground" />

                    <input
                      type="password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter password"
                      className="h-12 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="rounded-xl border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Login to Dashboard
                </button>

                <div className="rounded-xl bg-muted p-4 text-xs text-muted-foreground">
                  <p>
                    Demo Credentials:
                  </p>

                  <p className="mt-1">
                    Email:
                    {" "}
                    john@gmail.com
                  </p>

                  <p>
                    Password:
                    {" "}
                    1234
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD */}

      <div
        className={cn(
          "space-y-6 p-6 transition-all duration-300",
          !isAuthenticated &&
            "pointer-events-none select-none blur-md"
        )}
      >
        {/* HEADER */}

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            CRM Dashboard
          </h1>

          <p className="text-muted-foreground">
            AI-powered vehicle sales
            pipeline overview
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
          />
        </div>

        {/* CHARTS */}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                Leads Per Pipeline Stage
              </CardTitle>

              <CardDescription>
                Current lead distribution
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Leads",
                    color:
                      "hsl(var(--primary))",
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
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="name"
                    />

                    <YAxis />

                    <ChartTooltip
                      content={
                        <ChartTooltipContent />
                      }
                    />

                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Lead Priority
              </CardTitle>

              <CardDescription>
                AI classification
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
                    {priorityData.map(
                      (entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.color
                          }
                        />
                      )
                    )}
                  </Pie>

                  <ChartTooltip
                    content={
                      <ChartTooltipContent />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* FOLLOW UPS */}

        <Card>
          <CardHeader>
            <CardTitle>
              Follow-ups Triggered
            </CardTitle>

            <CardDescription>
              Automated Maya engagement
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ChartContainer
              config={{
                followUps: {
                  label: "Follow-ups",
                  color:
                    "hsl(var(--chart-2))",
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
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="day" />

                  <YAxis />

                  <ChartTooltip
                    content={
                      <ChartTooltipContent />
                    }
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

        {/* RECENT ACTIVITY */}

        <Card>
          <CardHeader>
            <CardTitle>
              Recent Pipeline Activity
            </CardTitle>

            <CardDescription>
              Latest lead movements
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {leads
                .slice(0, 6)
                .map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-xl border p-4"
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
                              (
                                stage
                              ) =>
                                stage.id ===
                                lead.stage
                            )?.name
                          }
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(
                          lead.budget
                        )}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {
                          lead.lastActivity
                        }
                      </p>
                    </div>
                  </div>
                ))}

              {leads.length === 0 &&
                !error && (
                  <div className="py-12 text-center text-muted-foreground">
                    No leads available
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
              Recent AI automation
              activity
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {recentWorkflowLogs.length >
              0 ? (
                recentWorkflowLogs.map(
                  (
                    log: any,
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="rounded-xl border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {log.action ||
                            "Workflow Event"}
                        </p>

                        <span className="text-xs text-muted-foreground">
                          {log.timestamp ||
                            "Now"}
                        </span>
                      </div>

                      {log.message && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {
                            log.message
                          }
                        </p>
                      )}
                    </div>
                  )
                )
              ) : (
                <p className="py-6 text-center text-muted-foreground">
                  No workflow activity
                  yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
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