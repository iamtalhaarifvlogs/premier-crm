// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';

const AWS_API = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data";

// Generic handler for all operations
async function callAWS(body: any, method: string = "POST") {
  const response = await fetch(AWS_API, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  console.log(`AWS Response [${method}]:`, response.status, text);

  if (response.ok) {
    return { success: true, data: text };
  } else {
    return { success: false, error: text };
  }
}

// Create / Update / Delete
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await callAWS(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request); // Reuse same handler
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await callAWS(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}