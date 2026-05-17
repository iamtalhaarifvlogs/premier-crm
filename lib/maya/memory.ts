import { Lead } from "./types"

const API = "/api/maya-memory"

/*
|--------------------------------------------------------------------------
| SAVE MEMORY
|--------------------------------------------------------------------------
*/

export async function saveMemory(entry: {
  lead_id: string
  context_type: string
  content: any
}) {
  try {
    const response = await fetch(API, {
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
    })

    return await response.json()
  } catch (error) {
    console.error(
      "Maya memory save error:",
      error
    )

    return {
      success: false,
    }
  }
}

/*
|--------------------------------------------------------------------------
| GET MEMORY
|--------------------------------------------------------------------------
*/

export async function getMemory(
  lead_id: string
) {
  try {
    const response = await fetch(
      `${API}?lead_id=${lead_id}`,
      {
        method: "GET",
        cache: "no-store",
      }
    )

    return await response.json()
  } catch (error) {
    console.error(
      "Maya memory fetch error:",
      error
    )

    return {
      Items: [],
    }
  }
}

/*
|--------------------------------------------------------------------------
| SAVE CONVERSATION
|--------------------------------------------------------------------------
*/

export async function saveConversationMemory(
  lead_id: string,
  message: string,
  sender: "maya" | "admin" | "customer"
) {
  return saveMemory({
    lead_id,
    context_type: `conversation_${Date.now()}`,
    content: {
      sender,
      message,
    },
  })
}

/*
|--------------------------------------------------------------------------
| SAVE STAGE MEMORY
|--------------------------------------------------------------------------
*/

export async function saveStageMemory(
  lead_id: string,
  from: string,
  to: string
) {
  return saveMemory({
    lead_id,
    context_type: "stage_change",
    content: {
      from,
      to,
    },
  })
}

/*
|--------------------------------------------------------------------------
| SAVE OBJECTION
|--------------------------------------------------------------------------
*/

export async function saveObjectionMemory(
  lead_id: string,
  objection: string
) {
  return saveMemory({
    lead_id,
    context_type: "objection",
    content: {
      objection,
    },
  })
}

/*
|--------------------------------------------------------------------------
| SAVE QUALIFICATION
|--------------------------------------------------------------------------
*/

export async function saveQualificationMemory(
  lead_id: string,
  note: string
) {
  return saveMemory({
    lead_id,
    context_type: "qualification",
    content: {
      note,
    },
  })
}

/*
|--------------------------------------------------------------------------
| BUILD LEAD CONTEXT
|--------------------------------------------------------------------------
*/

export async function buildLeadContext(
  lead: Lead
) {
  try {
    const memory = await getMemory(
      lead.id || lead.lead_id || ""
    )

    return {
      lead,
      memory:
        memory?.Items || [],
    }
  } catch (error) {
    console.error(
      "Context build error:",
      error
    )

    return {
      lead,
      memory: [],
    }
  }
}