import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// In production, this would use your database
interface VehicleViewData {
  id: string;
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  price: number;
  timestamp: string;
  userAgent: string;
  referrer: string;
  url: string;
  ip: string;
}

let vehicleViews: VehicleViewData[] = [];

export async function POST(request: NextRequest) {
  try {
    const viewData = await request.json();
    
    // Add timestamp and ID
    const view = {
      id: Date.now().toString(),
      ...viewData,
      timestamp: new Date().toISOString(),
      ip: request.ip || 'unknown',
    };
    
    // Store the view (in production, save to database)
    vehicleViews.push(view);
    
    // Keep only last 1000 views to prevent memory issues
    if (vehicleViews.length > 1000) {
      vehicleViews = vehicleViews.slice(-1000);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    
    // Calculate time range
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    // Filter views by date range
    const filteredViews = vehicleViews.filter(view => 
      new Date(view.timestamp) >= startDate
    );
    
    // Calculate analytics
    const totalViews = filteredViews.length;
    const uniqueVehicles = new Set(filteredViews.map(v => v.vehicleId)).size;
    const averageViewsPerVehicle = uniqueVehicles > 0 ? totalViews / uniqueVehicles : 0;
    
    // Top vehicles by view count
    interface VehicleViewCount {
      vehicleId: string;
      make: string;
      model: string;
      year: number;
      price: number;
      viewCount: number;
      timestamp: string;
      referrer: string;
    }
    
    const vehicleViewCounts: Record<string, VehicleViewCount> = filteredViews.reduce((acc, view) => {
      const key = view.vehicleId;
      if (!acc[key]) {
        acc[key] = {
          vehicleId: view.vehicleId,
          make: view.make,
          model: view.model,
          year: view.year,
          price: view.price,
          viewCount: 0,
          timestamp: view.timestamp,
          referrer: view.referrer
        };
      }
      acc[key].viewCount++;
      return acc;
    }, {} as Record<string, VehicleViewCount>);
    
    const topVehicles = Object.values(vehicleViewCounts)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5);
    
    // Recent views
    const recentViews = filteredViews
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    
    // Referrer stats
    const referrerCounts: Record<string, number> = filteredViews.reduce((acc, view) => {
      const referrer = view.referrer || 'direct';
      const source = referrer.includes('google') ? 'Google' :
                    referrer.includes('facebook') ? 'Facebook' :
                    referrer.includes('instagram') ? 'Instagram' :
                    referrer === 'direct' ? 'Direct' : 'Other';
      
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const referrerStats = Object.entries(referrerCounts)
      .map(([source, count]) => ({ source, count: count as number }))
      .sort((a, b) => b.count - a.count);
    
    // Daily views for chart
    const dailyViews = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayViews = filteredViews.filter(view => 
        view.timestamp.split('T')[0] === dateStr
      ).length;
      
      dailyViews.push({ date: dateStr, views: dayViews });
    }
    
    const analytics = {
      totalViews,
      uniqueVehiclesViewed: uniqueVehicles,
      averageViewsPerVehicle: parseFloat(averageViewsPerVehicle.toFixed(1)),
      topVehicles,
      recentViews,
      referrerStats,
      dailyViews
    };
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
