import { NextRequest, NextResponse } from 'next/server';
import { LambertSyncManager } from '@/lib/vendor-sync-manager';

// POST /api/vendors/[vendorId]/sync - Sync vendor inventory
export async function POST(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const { vendorId } = params;
    
    // Handle different vendor types
    switch (vendorId) {
      case 'lambert': {
        const syncManager = new LambertSyncManager();
        const result = await syncManager.syncLambertInventory();
        
        return NextResponse.json(result);
      }
      
      case 'internal': {
        return NextResponse.json(
          { error: 'Internal inventory cannot be synced automatically' },
          { status: 400 }
        );
      }
      
      default: {
        return NextResponse.json(
          { error: `Unknown vendor: ${vendorId}` },
          { status: 404 }
        );
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { 
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
