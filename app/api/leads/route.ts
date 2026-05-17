// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';

const AWS_API = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data";

// GET - Fetch leads
export async function GET() {
  try {
    const response = await fetch(`${AWS_API}?TableName=tbl_leads`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const text = await response.text();
    console.log("GET Leads Response:", response.status);

    if (response.ok) {
      const data = JSON.parse(text);
      const items = data.Items || [];
      return NextResponse.json(items);
    } else {
      return NextResponse.json({ success: false, error: text }, { status: response.status });
    }
  } catch (error: any) {
    console.error("GET Leads Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create
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

// PUT - Update
export async function PUT(request: NextRequest) {
  return POST(request); // Reuse same handler
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(AWS_API, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    if (response.ok) return NextResponse.json({ success: true });
    return NextResponse.json({ success: false, error: text }, { status: response.status });
  } catch (error: any) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}