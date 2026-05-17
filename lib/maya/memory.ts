export async function saveMemory(entry: {
  lead_id: string;
  context_type: string;
  content: string;
}) {
  await fetch("/api/maya-memory", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      TableName: "tbl_maya",
      Item: {
        lead_id: entry.lead_id,
        context_type: entry.context_type,
        content: entry.content,
        timestamp: new Date().toISOString(),
      },
    }),
  });
}