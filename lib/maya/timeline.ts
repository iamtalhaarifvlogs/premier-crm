export interface TimelineEvent {
  lead_id: string
  type: string
  message: string
  createdAt: string
}

export async function createTimelineEvent(
  event: TimelineEvent
) {
  await fetch("/api/timeline", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      TableName: "tbl_timeline",
      Item: {
        ...event,
        createdAt:
          event.createdAt ||
          new Date().toISOString(),
      },
    }),
  })
}