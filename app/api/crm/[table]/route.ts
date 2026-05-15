// app/api/crm/[table]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const API_BASE = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data"

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const tableName = params.table

  try {
    const res = await fetch(`\( {API_BASE}?TableName= \){tableName}`, {
      method: "GET",
      cache: "no-store",
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error("Proxy Error:", err)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}