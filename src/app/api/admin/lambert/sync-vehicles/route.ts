import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const IMAGE_PROCESSOR_URL = 'https://image-processor.nick-damato0011527.workers.dev';

interface ScrapedVehicle {
  vin?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  odometer?: number;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  color?: string;
  stock_number?: string;
  description?: string;
  images?: string[];
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { vehicles } = await request.json() as { vehicles: ScrapedVehicle[] };
    
    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json(
        { error: 'No vehicles provided' },
        { status: 400 }
      );
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const vehicleIdsNeedingImages: (string | number)[] = [];

    for (const vehicle of vehicles) {
      // Check if vehicle exists (by VIN or stock number)
      const existing = await prisma.vehicle.findFirst({
        where: {
          OR: [
            vehicle.vin ? { vin: vehicle.vin } : {},
            vehicle.stock_number ? { stockNumber: vehicle.stock_number } : {},
          ].filter(obj => Object.keys(obj).length > 0)
        }
      });

      const vehicleData = {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        odometer: vehicle.odometer || 0,
        bodyType: vehicle.bodyType || '',
        fuelType: vehicle.fuelType || '',
        transmission: vehicle.transmission || '',
        drivetrain: vehicle.drivetrain || '',
        color: vehicle.color || '',
        vin: vehicle.vin || '',
        stockNumber: vehicle.stock_number || '',
        description: vehicle.description || '',
        images: JSON.stringify(vehicle.images || []),
        vendor_id: 'lambert',
        vendor_name: 'Lambert Auto',
        vendor_url: vehicle.url || '',
        vendor_status: 'active',
        is_published: true,
        lastSynced: new Date()
      };

      let vehicleId: string | number;

      if (existing) {
        // Check if anything changed
        const hasChanges = 
          existing.price !== vehicle.price ||
          existing.odometer !== (vehicle.odometer || 0) ||
          existing.description !== (vehicle.description || '');

        if (hasChanges) {
          await prisma.vehicle.update({
            where: { id: existing.id },
            data: vehicleData
          });
          vehicleId = existing.id;
          updatedCount++;
        } else {
          // Just update lastSynced
          await prisma.vehicle.update({
            where: { id: existing.id },
            data: { lastSynced: new Date() }
          });
          vehicleId = existing.id;
          skippedCount++;
        }
      } else {
        // Create new vehicle
        const created = await prisma.vehicle.create({
          data: vehicleData
        });
        vehicleId = created.id;
        newCount++;
      }

      // Check if vehicle has vendor image URLs that need processing
      const images = vehicle.images || [];
      const hasVendorUrls = images.some(
        (img) => typeof img === 'string' && img.startsWith('http') && !img.includes('imagedelivery.net')
      );

      if (hasVendorUrls) {
        vehicleIdsNeedingImages.push(vehicleId);
      }
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
      new: newCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: vehicles.length,
      imageProcessing: vehicleIdsNeedingImages.length > 0 ? {
        triggered: true,
        jobId: `lambert-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        count: vehicleIdsNeedingImages.length
      } : null
    });

  } catch (error) {
    console.error('Sync vehicles error:', error);
    return NextResponse.json(
      { error: 'Failed to sync vehicles', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
