// app/api/crm/[table]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data";

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const tableName = params.table;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25 seconds

    const response = await fetch(
      `\( {API_BASE}?TableName= \){tableName}`,
      {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
        next: { revalidate: 0 },
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error body");
      console.error(`AWS Error ${response.status}:`, errorText);
      return NextResponse.json({ 
        error: `AWS returned ${response.status}`,
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Proxy Error:", error.message);
    return NextResponse.json({ 
      error: "Failed to fetch from AWS",
      message: error.message,
      suggestion: "Check Lambda CloudWatch logs for details"
    }, { status: 502 });
  }
}