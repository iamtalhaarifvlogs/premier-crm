// app/api/crm/[table]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data";

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const tableName = params.table;

  try {
    console.log(`[Proxy] Calling AWS for: ${tableName}`);

    const response = await fetch(
      `\( {API_BASE}?TableName= \){tableName}`,
      { 
        method: "GET",
        cache: "no-store",
        next: { revalidate: 0 },
      }
    );

    console.log(`[Proxy] AWS Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();   // Get raw response first

    console.log(`[Proxy] Raw Response:`, responseText.substring(0, 500)); // First 500 chars

    if (!response.ok) {
      return NextResponse.json({ 
        error: `AWS HTTP ${response.status}`,
        body: responseText 
      }, { status: response.status });
    }

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({ 
        error: "Invalid JSON from AWS",
        raw: responseText 
      }, { status: 502 });
    }

    console.log(`[Proxy] Parsed successfully - Items: ${data.Items?.length || data.length || 0}`);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("[Proxy] Critical Error:", error);
    return NextResponse.json({ 
      error: "Proxy failed",
      message: error.message 
    }, { status: 502 });
  }
}