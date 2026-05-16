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

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: text }, { status: response.status });
    }
  } catch (error: any) {
    console.error("POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update Lead
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Proxy received update payload:", JSON.stringify(body, null, 2));

    const response = await fetch(AWS_API, {
      method: "POST",   // Most Lambda functions use POST for both create & update
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log("AWS Response Status:", response.status);
    console.log("AWS Response:", responseText);

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: responseText || "Unknown error" 
      }, { status: response.status });
    }
  } catch (error: any) {
    console.error("PUT Proxy Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}