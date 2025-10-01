import { NextResponse } from 'next/server';

const WORKER_API_URL = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev';

export async function GET() {
  try {
    const response = await fetch(`${WORKER_API_URL}/api/admin/site-info`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch site info' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching site info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${WORKER_API_URL}/api/admin/site-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to save site info' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving site info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
