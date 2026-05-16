// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';

const AWS_API = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data";

// Create Lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(AWS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    if (response.ok) return NextResponse.json({ success: true });
    return NextResponse.json({ success: false, error: text }, { status: response.status });
  } catch (error: any) {
    console.error("POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update Lead
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(AWS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    if (response.ok) return NextResponse.json({ success: true });
    return NextResponse.json({ success: false, error: text }, { status: response.status });
  } catch (error: any) {
    console.error("PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete Lead
export async function DELETE(request: NextRequest) {
  try {
    const { lead_id } = await request.json();

    if (!lead_id) {
      return NextResponse.json({ success: false, error: "lead_id is required" }, { status: 400 });
    }

    const response = await fetch(AWS_API, {
      method: "POST",   // Most Lambda functions use POST for all operations
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        TableName: "tbl_leads",
        Key: { lead_id },
        Operation: "delete"   // Optional flag for your Lambda
      }),
    });

    const text = await response.text();
    console.log("Delete Response:", response.status, text);

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: text }, { status: response.status });
    }
  } catch (error: any) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}