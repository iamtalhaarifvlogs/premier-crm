// app/api/crm/[table]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data";

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const tableName = params.table;

  console.log(`[Proxy] Request for table: ${tableName}`);

  try {
    const startTime = Date.now();

    const response = await fetch(
      `\( {API_BASE}?TableName= \){tableName}`,
      {
        method: "GET",
        cache: "no-store",
        next: { revalidate: 0 },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[Proxy] AWS responded in ${duration}ms with status ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] AWS Error ${response.status}:`, errorText);
      return NextResponse.json(
        { error: `AWS Error ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[Proxy] Success - ${data.Items?.length || data.length || 0} items returned`);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Proxy] Fetch Failed:", error.message || error);
    return NextResponse.json(
      { 
        error: "Proxy failed to fetch data from AWS",
        message: error.message || "Unknown error",
        suggestion: "Check AWS Lambda / API Gateway logs"
      },
      { status: 502 }
    );
  }
}