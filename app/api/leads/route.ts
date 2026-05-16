// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';

const AWS_API = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data";

// POST = Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(AWS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();

    if (response.ok) {
      return NextResponse.json({ success: true, message: "Lead created successfully" });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: responseText 
      }, { status: response.status });
    }
  } catch (error: any) {
    console.error("POST Proxy Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// PUT = Update existing lead
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(AWS_API, {
      method: "PUT",           // or POST if your Lambda only supports POST for updates
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();

    if (response.ok) {
      return NextResponse.json({ success: true, message: "Lead updated successfully" });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: responseText 
      }, { status: response.status });
    }
  } catch (error: any) {
    console.error("PUT Proxy Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}