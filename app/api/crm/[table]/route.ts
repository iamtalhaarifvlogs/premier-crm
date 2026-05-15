// app/api/crm/[table]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const API_BASE = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data"

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const tableName = params.table

  try {
    const response = await fetch(`\( {API_BASE}?TableName= \){tableName}`, {
      method: "GET",
      cache: "no-store",
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({ error: text }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Proxy Error:", error)
    return NextResponse.json({ error: error.message }, { status: 502 })
  }
}