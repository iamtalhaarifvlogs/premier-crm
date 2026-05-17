import { Lead, PipelineStage } from "@/lib/mock-data"

export async function moveLeadStage(
  lead: Lead,
  stage: PipelineStage
) {
  const updatedLead = {
    ...lead,
    stage,
  }

  await fetch("/api/leads", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      TableName: "tbl_leads",
      Item: updatedLead,
    }),
  })

  return updatedLead
}

export async function createLead(lead: any) {
  await fetch("/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      TableName: "tbl_leads",
      Item: lead,
    }),
  })
}

export async function deleteLead(lead_id: string) {
  await fetch("/api/leads", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      TableName: "tbl_leads",
      Key: {
        lead_id,
      },
    }),
  })
}

export async function createWorkflowLog(log: any) {
  await fetch("/api/workflow-logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(log),
  })
}
