// app/api/leads/route.ts

import { NextRequest, NextResponse } from 'next/server';

const AWS_API =
  'https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data';

/*
|--------------------------------------------------------------------------
| GET - FETCH LEADS
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const response = await fetch(
      `${AWS_API}?TableName=tbl_leads`,
      {
        method: 'GET',
        headers: {
          'Content-Type':
            'application/json',
        },
        cache: 'no-store',
      }
    );

    const text =
      await response.text();

    console.log(
      'GET Leads Response:',
      response.status
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: text,
        },
        {
          status:
            response.status,
        }
      );
    }

    const data =
      JSON.parse(text);

    return NextResponse.json(
      data.Items || []
    );
  } catch (error: any) {
    console.error(
      'GET Leads Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST - CREATE LEAD
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const payload = {
      action: 'create',
      ...body,
    };

    const response = await fetch(
      AWS_API,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(
          payload
        ),
      }
    );

    const text =
      await response.text();

    console.log(
      'POST Response:',
      response.status,
      text
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: text,
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error(
      'POST Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT - UPDATE LEAD
|--------------------------------------------------------------------------
*/

export async function PUT(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const payload = {
      action: 'update',
      ...body,
    };

    const response = await fetch(
      AWS_API,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(
          payload
        ),
      }
    );

    const text =
      await response.text();

    console.log(
      'PUT Response:',
      response.status,
      text
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: text,
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error(
      'PUT Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE LEAD
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const payload = {
      action: 'delete',
      ...body,
    };

    console.log(
      'DELETE Payload:',
      payload
    );

    const response = await fetch(
      AWS_API,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(
          payload
        ),
      }
    );

    const text =
      await response.text();

    console.log(
      'DELETE Response:',
      response.status,
      text
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: text,
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error(
      'DELETE Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}