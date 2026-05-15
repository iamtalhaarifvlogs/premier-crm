// app/dashboard/page.tsx   (or wherever your main dashboard page is)
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getLeads, getMessages, getWorkflowLogs, getStageHistory, getVehicleMatches } from "@/lib/mock-data";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  let leads = [];
  let messages = {};
  let workflowLogs = [];
  let stageHistory = {};
  let vehicleMatches = [];
  let error: string | null = null;

  try {
    // Fetch all necessary data on the server
    [leads, messages, workflowLogs, stageHistory, vehicleMatches] = await Promise.all([
      getLeads(),
      getMessages(),
      getWorkflowLogs(),
      getStageHistory(),
      getVehicleMatches(),
    ]);
  } catch (err: any) {
    console.error("Dashboard data fetch error:", err);
    error = "Failed to load dashboard data. Please check your connection and proxy setup.";
  }

  return (
    <DashboardContent
      leads={leads}
      messages={messages}
      workflowLogs={workflowLogs}
      stageHistory={stageHistory}
      vehicleMatches={vehicleMatches}
      error={error}
    />
  );
}