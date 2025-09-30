/**
 * Vendor Sync Manager
 * Handles synchronization of vehicle inventory from multiple vendors
 */

interface VendorVehicle {
  vin?: string;
  stock_number?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  odometer?: number;
  images?: string[];
  description?: string;
}

interface SyncResult {
  vendor_id: string;
  vehicles_found: number;
  new_vehicles: number;
  updated_vehicles: number;
  removed_vehicles: number;
  unlisted_vehicles: number;
  status: 'success' | 'partial' | 'failed';
  error_message?: string;
}

export class VendorSyncManager {
  private vendorId: string;
  private vendorName: string;
  private gracePeriodDays: number;
  private autoRemoveAfterDays: number;

  constructor(vendorId: string, vendorName: string, gracePeriodDays = 3, autoRemoveAfterDays = 7) {
    this.vendorId = vendorId;
    this.vendorName = vendorName;
    this.gracePeriodDays = gracePeriodDays;
    this.autoRemoveAfterDays = autoRemoveAfterDays;
  }

  /**
   * Main sync method - processes vendor inventory
   */
  async syncVendorInventory(vendorVehicles: VendorVehicle[]): Promise<SyncResult> {
    const result: SyncResult = {
      vendor_id: this.vendorId,
      vehicles_found: vendorVehicles.length,
      new_vehicles: 0,
      updated_vehicles: 0,
      removed_vehicles: 0,
      unlisted_vehicles: 0,
      status: 'success'
    };

    try {
      // Get existing vehicles from this vendor
      const existingVehicles = await this.getExistingVendorVehicles();
      
      // Process each vehicle from vendor
      for (const vendorVehicle of vendorVehicles) {
        const existing = this.findExistingVehicle(vendorVehicle, existingVehicles);
        
        if (existing) {
          // Update existing vehicle
          const updated = await this.updateVehicle(existing.id, {
            ...vendorVehicle,
            last_seen_from_vendor: new Date().toISOString(),
            vendor_status: 'active',
            sync_status: 'synced',
            is_published: true
          });
          
          if (updated) {
            result.updated_vehicles++;
          }
        } else {
          // Add new vehicle
          const added = await this.addVehicle({
            ...vendorVehicle,
            vendor_id: this.vendorId,
            vendor_name: this.vendorName,
            vendor_stock_number: vendorVehicle.stock_number,
            vendor_status: 'active',
            sync_status: 'synced',
            last_seen_from_vendor: new Date().toISOString(),
            is_published: true
          });
          
          if (added) {
            result.new_vehicles++;
          }
        }
      }
      
      // Handle vehicles not in current sync
      const vehiclesNotInSync = existingVehicles.filter(
        ev => !vendorVehicles.find(vv => this.vehiclesMatch(vv, ev))
      );
      
      for (const missingVehicle of vehiclesNotInSync) {
        const handled = await this.handleMissingVehicle(missingVehicle);
        if (handled.unlisted) result.unlisted_vehicles++;
        if (handled.removed) result.removed_vehicles++;
      }
      
      // Log sync results
      await this.logSyncResult(result);
      
    } catch (error) {
      result.status = 'failed';
      result.error_message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Vendor sync failed:', error);
    }
    
    return result;
  }

  /**
   * Handle vehicles that are no longer in vendor feed
   */
  private async handleMissingVehicle(vehicle: any): Promise<{ unlisted: boolean; removed: boolean }> {
    // If sold by us, keep it
    if (vehicle.isSold === 1 || vehicle.vendor_status === 'sold_by_us') {
      return { unlisted: false, removed: false };
    }
    
    // Calculate days since last seen
    const lastSeen = new Date(vehicle.last_seen_from_vendor);
    const daysSinceLastSeen = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastSeen < this.gracePeriodDays) {
      // Within grace period - mark as unlisted but keep visible
      await this.updateVehicle(vehicle.id, {
        vendor_status: 'unlisted',
        sync_status: 'pending_removal'
      });
      return { unlisted: true, removed: false };
      
    } else if (daysSinceLastSeen >= this.gracePeriodDays && daysSinceLastSeen < this.autoRemoveAfterDays) {
      // Past grace period - hide from public but keep in admin
      await this.updateVehicle(vehicle.id, {
        vendor_status: 'unlisted',
        is_published: false,
        sync_status: 'pending_removal'
      });
      return { unlisted: true, removed: false };
      
    } else {
      // Past auto-remove period - mark as removed
      await this.updateVehicle(vehicle.id, {
        vendor_status: 'removed',
        is_published: false,
        sync_status: 'synced'
      });
      return { unlisted: false, removed: true };
    }
  }

  /**
   * Check if two vehicles match (same vehicle from vendor)
   */
  private vehiclesMatch(vendorVehicle: VendorVehicle, existingVehicle: any): boolean {
    // Match by VIN if available
    if (vendorVehicle.vin && existingVehicle.vin) {
      return vendorVehicle.vin === existingVehicle.vin;
    }
    
    // Match by stock number if available
    if (vendorVehicle.stock_number && existingVehicle.vendor_stock_number) {
      return vendorVehicle.stock_number === existingVehicle.vendor_stock_number;
    }
    
    // Fallback: match by make, model, year (less reliable)
    return vendorVehicle.make === existingVehicle.make &&
           vendorVehicle.model === existingVehicle.model &&
           vendorVehicle.year === existingVehicle.year;
  }

  /**
   * Find existing vehicle in database
   */
  private findExistingVehicle(vendorVehicle: VendorVehicle, existingVehicles: any[]): any {
    return existingVehicles.find(ev => this.vehiclesMatch(vendorVehicle, ev));
  }

  /**
   * Get existing vehicles from this vendor
   */
  private async getExistingVendorVehicles(): Promise<any[]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles?vendor_id=${this.vendorId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get existing vehicles:', error);
    }
    return [];
  }

  /**
   * Add new vehicle to database
   */
  private async addVehicle(vehicle: any): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle)
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to add vehicle:', error);
      return false;
    }
  }

  /**
   * Update existing vehicle
   */
  private async updateVehicle(vehicleId: string, updates: any): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to update vehicle:', error);
      return false;
    }
  }

  /**
   * Log sync results to database
   */
  private async logSyncResult(result: SyncResult): Promise<void> {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendor-sync-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...result,
          vendor_name: this.vendorName,
          sync_date: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to log sync result:', error);
    }
  }
}

/**
 * Lambert-specific sync implementation
 */
export class LambertSyncManager extends VendorSyncManager {
  constructor() {
    super('lambert', 'Lambert Auto', 3, 7);
  }

  /**
   * Transform Lambert vehicle data to standard format
   */
  transformLambertVehicle(lambertData: any): VendorVehicle {
    return {
      vin: lambertData.vin,
      stock_number: lambertData.stock_number,
      make: lambertData.make,
      model: lambertData.model,
      year: parseInt(lambertData.year),
      price: parseFloat(lambertData.price),
      odometer: lambertData.mileage ? parseInt(lambertData.mileage) : undefined,
      images: lambertData.images || [],
      description: lambertData.description
    };
  }

  /**
   * Sync Lambert inventory
   */
  async syncLambertInventory(): Promise<SyncResult> {
    try {
      // Call Lambert scraper
      const response = await fetch('https://lambert-scraper.nick-damato0011527.workers.dev/api/lambert/scrape-with-images', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to scrape Lambert inventory');
      }
      
      const data = await response.json();
      const vehicles = data.vehicles || [];
      
      // Transform Lambert vehicles to standard format
      const standardVehicles = vehicles.map((v: any) => this.transformLambertVehicle(v));
      
      // Run sync
      return await this.syncVendorInventory(standardVehicles);
      
    } catch (error) {
      return {
        vendor_id: 'lambert',
        vehicles_found: 0,
        new_vehicles: 0,
        updated_vehicles: 0,
        removed_vehicles: 0,
        unlisted_vehicles: 0,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
