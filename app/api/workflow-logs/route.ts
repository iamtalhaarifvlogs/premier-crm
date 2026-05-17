import { NextRequest, NextResponse } from "next/server"

const API =
  "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        TableName: "tbl_workflow_logs",
        Item: body,
      }),
    })

    return NextResponse.json({
      success: response.ok,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    )
  }
}
