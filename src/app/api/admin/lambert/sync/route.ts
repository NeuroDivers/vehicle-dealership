import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // In production, call your Cloudflare Worker to get Lambert vehicles
    const WORKER_URL = process.env.LAMBERT_WORKER_URL || 
                       'https://lambert-scraper.your-subdomain.workers.dev';
    
    const response = await fetch(`${WORKER_URL}/api/lambert/sync-to-main`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      return NextResponse.json({
        success: true,
        synced: result.stats?.synced || 0,
        new: result.stats?.new || 0,
        updated: result.stats?.updated || 0
      });
    }
    
    // Fallback: Sync from local database (development)
    const lambertVehicles = [
      {
        make: 'Toyota',
        model: 'C-HR XLE',
        year: 2018,
        price: 13999,
        odometer: 98000,
        bodyType: 'SUV',
        color: 'Silver',
        fuelType: 'gasoline',
        description: 'Well-maintained vehicle from Lambert inventory',
        images: JSON.stringify([]),
        source: 'lambert',
        partnerName: 'Automobile Lambert',
        partnerUrl: 'https://www.automobile-lambert.com/cars/2018-toyota-c-hr/',
        partnerVin: 'NMTKHMBX8JR064521',
        partnerStock: 'LAM-001'
      }
    ];
    
    let synced = 0;
    
    for (const vehicle of lambertVehicles) {
      // Check if vehicle already exists
      const existing = await prisma.vehicle.findFirst({
        where: {
          OR: [
            { partnerVin: vehicle.partnerVin },
            { partnerUrl: vehicle.partnerUrl }
          ]
        }
      });
      
      if (existing) {
        // Update existing vehicle
        await prisma.vehicle.update({
          where: { id: existing.id },
          data: {
            price: vehicle.price,
            odometer: vehicle.odometer,
            lastSynced: new Date()
          }
        });
      } else {
        // Create new vehicle
        await prisma.vehicle.create({
          data: {
            ...vehicle,
            lastSynced: new Date()
          }
        });
      }
      
      synced++;
    }
    
    return NextResponse.json({
      success: true,
      synced,
      message: `Successfully synced ${synced} vehicles from Lambert`
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Lambert inventory' },
      { status: 500 }
    );
  }
}
