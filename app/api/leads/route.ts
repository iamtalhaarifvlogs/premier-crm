// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';

const AWS_API = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(AWS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: responseText }, { status: response.status });
    }
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
