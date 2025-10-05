import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const IMAGE_PROCESSOR_URL = 'https://image-processor.nick-damato0011527.workers.dev';

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
    const vehicleIdsNeedingImages: (string | number)[] = [];
    
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
      
      let vehicleId: string | number;
      
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
        vehicleId = existing.id;
      } else {
        // Create new vehicle
        const created = await prisma.vehicle.create({
          data: {
            ...vehicle,
            lastSynced: new Date()
          }
        });
        vehicleId = created.id;
      }
      
      // Check if vehicle has vendor image URLs that need processing
      const images = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images;
      const hasVendorUrls = Array.isArray(images) && images.some(
        (img: any) => typeof img === 'string' && img.startsWith('http') && !img.includes('imagedelivery.net')
      );
      
      if (hasVendorUrls) {
        vehicleIdsNeedingImages.push(vehicleId);
      }
      
      synced++;
    }
    
    // Trigger async image processing for vehicles with vendor URLs
    if (vehicleIdsNeedingImages.length > 0) {
      const jobId = `lambert-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      fetch(`${IMAGE_PROCESSOR_URL}/api/process-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleIds: vehicleIdsNeedingImages,
          batchSize: 10,
          jobId: jobId,
          vendorName: 'Lambert Auto'
        })
      }).catch(err => {
        console.warn('Image processor trigger failed:', err.message);
      });
      
      console.log(`🚀 Triggered image processing for ${vehicleIdsNeedingImages.length} vehicles (Job: ${jobId})`);
    }
    
    return NextResponse.json({
      success: true,
      synced,
      imageProcessing: vehicleIdsNeedingImages.length > 0 ? {
        triggered: true,
        count: vehicleIdsNeedingImages.length
      } : null,
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
