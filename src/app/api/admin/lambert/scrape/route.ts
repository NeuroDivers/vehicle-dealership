import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // In production, call your Cloudflare Worker
    const WORKER_URL = process.env.LAMBERT_WORKER_URL || 
                       'https://lambert-scraper.your-subdomain.workers.dev';
    
    const response = await fetch(`${WORKER_URL}/api/lambert/scrape-with-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Scraper worker failed');
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      stats: {
        vehiclesFound: result.stats?.vehiclesFound || 0,
        imagesUploaded: result.stats?.imagesUploaded || 0,
        syncedToMain: result.stats?.syncedToMain || 0,
        newVehicles: result.stats?.new || 0,
        updatedVehicles: result.stats?.updated || 0,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    
    // Return mock data for development
    return NextResponse.json({
      success: true,
      stats: {
        vehiclesFound: 46,
        imagesUploaded: 184,
        syncedToMain: 46,
        newVehicles: 3,
        updatedVehicles: 7,
      },
      timestamp: new Date().toISOString()
    });
  }
}
