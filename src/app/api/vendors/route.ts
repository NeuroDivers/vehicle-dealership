import { NextRequest, NextResponse } from 'next/server';

// GET /api/vendors - Get all vendors
export async function GET(request: NextRequest) {
  try {
    // Mock vendors data - replace with database query
    const vendors = [
      {
        vendor_id: 'lambert',
        vendor_name: 'Lambert Auto',
        vendor_type: 'scraper',
        last_sync: new Date(Date.now() - 3600000).toISOString(),
        is_active: true,
        sync_frequency: 'daily',
        auto_remove_after_days: 7,
        grace_period_days: 3,
        stats: {
          total_vehicles: 46,
          active_vehicles: 40,
          unlisted_vehicles: 6,
          sold_vehicles: 2
        }
      },
      {
        vendor_id: 'internal',
        vendor_name: 'Internal Inventory',
        vendor_type: 'manual',
        is_active: true,
        sync_frequency: 'manual',
        auto_remove_after_days: 0,
        grace_period_days: 0,
        stats: {
          total_vehicles: 12,
          active_vehicles: 10,
          unlisted_vehicles: 0,
          sold_vehicles: 2
        }
      }
    ];

    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Failed to fetch vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.vendor_id || !body.vendor_name) {
      return NextResponse.json(
        { error: 'vendor_id and vendor_name are required' },
        { status: 400 }
      );
    }

    // TODO: Insert into database
    const newVendor = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    console.error('Failed to create vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}
