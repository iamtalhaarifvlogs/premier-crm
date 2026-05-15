// app/api/crm/[table]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data";

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const tableName = params.table;

  console.log(`[API Proxy] Fetching table: ${tableName}`);

  try {
    const response = await fetch(
      `\( {API_BASE}?TableName= \){tableName}`,
      {
        method: "GET",
        cache: "no-store",           // Force fresh fetch
        next: { revalidate: 0 },     // Disable caching
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Proxy] HTTP ${response.status}:`, errorText);
      return NextResponse.json({ error: `Failed to fetch ${tableName}` }, { status: response.status });
    }

    const data = await response.json();
    console.log(`[API Proxy] ${tableName} → ${data.Items?.length || data.length || 0} items`);

    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Proxy] Error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}