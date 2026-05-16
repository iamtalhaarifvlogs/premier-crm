// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';

const AWS_API = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data";

// Create
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

// Update
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

// Delete - Multiple payload formats to handle different Lambda expectations
export async function DELETE(request: NextRequest) {
  try {
    const { lead_id } = await request.json();

    if (!lead_id) {
      return NextResponse.json({ success: false, error: "lead_id is required" }, { status: 400 });
    }

    console.log("Attempting to delete lead:", lead_id);

    // Try multiple common payload formats
    const payloads = [
      // Format 1: Standard with Key
      {
        TableName: "tbl_leads",
        Key: { lead_id: lead_id }
      },
      // Format 2: With Operation flag
      {
        TableName: "tbl_leads",
        Key: { lead_id: lead_id },
        Operation: "delete"
      },
      // Format 3: Simple Item style (some Lambdas expect this)
      {
        TableName: "tbl_leads",
        Item: { lead_id: lead_id }
      }
    ];

    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      console.log(`Trying payload format ${i+1}:`, payload);

      const response = await fetch(AWS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log(`Format ${i+1} Response: ${response.status} - ${text}`);

      if (response.ok) {
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: false, error: "All delete formats failed" }, { status: 400 });

  } catch (error: any) {
    console.error("DELETE Proxy Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}