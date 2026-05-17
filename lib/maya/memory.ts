const MAYA_API = "/api/maya-memory"

export async function saveMemory(
  leadId: string,
  contextType: string,
  data: any
) {
  try {
    await fetch(MAYA_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lead_id: leadId,
        context_type: contextType,
        data,
      }),
    })
  } catch (error) {
    console.error("saveMemory error", error)
  }
}

export async function getMemory(
  leadId: string,
  contextType: string
) {
  try {
    const response = await fetch(
      `${MAYA_API}?lead_id=${leadId}&context_type=${contextType}`,
      {
        cache: "no-store",
      }
    )

    return await response.json()
  } catch (error) {
    console.error(error)
    return null
  }
}
