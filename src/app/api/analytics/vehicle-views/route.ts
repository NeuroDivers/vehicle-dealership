import { NextRequest, NextResponse } from 'next/server';

const WORKER_API_URL = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Try to save to Cloudflare Worker
    try {
      const response = await fetch(`${WORKER_API_URL}/api/analytics/vehicle-views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        return NextResponse.json({ success: true }, { headers: corsHeaders });
      }
    } catch (workerError) {
      console.log('Worker API not available, tracking locally');
    }
    
    // Fallback: just return success (tracking is optional)
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't fail hard on analytics errors
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Proxy to Cloudflare Worker
    const url = new URL(request.url);
    const queryString = url.searchParams.toString();
    
    const response = await fetch(
      `${WORKER_API_URL}/api/analytics/vehicle-views${queryString ? `?${queryString}` : ''}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      // Return empty analytics if worker fails
      return NextResponse.json({
        totalViews: 0,
        uniqueVehiclesViewed: 0,
        averageViewsPerVehicle: 0,
        topVehicles: [],
        recentViews: [],
        referrerStats: [],
        dailyViews: []
      }, { headers: corsHeaders });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    // Return empty analytics on error
    return NextResponse.json({
      totalViews: 0,
      uniqueVehiclesViewed: 0,
      averageViewsPerVehicle: 0,
      topVehicles: [],
      recentViews: [],
      referrerStats: [],
      dailyViews: []
    }, { headers: corsHeaders });
  }
}
