'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, Upload, ExternalLink, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface ScraperStats {
  lastRun?: string;
  vehiclesFound: number;
  imagesUploaded: number;
  syncedToMain: number;
  newVehicles: number;
  updatedVehicles: number;
  status: 'idle' | 'running' | 'success' | 'error';
}

interface LambertVehicle {
  id: string;
  title: string;
  price: number;
  year: number;
  make: string;
  model: string;
  vin?: string;
  stock?: string;
  images: string[];
  status: 'new' | 'updated' | 'unchanged' | 'existing';
  lastSynced?: string;
}

export default function LambertScraperPanel() {
  const [stats, setStats] = useState<ScraperStats>({
    vehiclesFound: 0,
    imagesUploaded: 0,
    syncedToMain: 0,
    newVehicles: 0,
    updatedVehicles: 0,
    status: 'idle'
  });
  
  const [recentVehicles, setRecentVehicles] = useState<LambertVehicle[]>([]);
  const [isScrapingRunning, setIsScrapingRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'vehicles' | 'settings'>('overview');

  useEffect(() => {
    loadStats();
    loadRecentVehicles();
  }, []);

  const loadStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                     'https://vehicle-admin-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/admin/lambert/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRecentVehicles = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                     'https://vehicle-admin-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/admin/lambert/vehicles?limit=10`);
      if (response.ok) {
        const vehicles = await response.json();
        setRecentVehicles(vehicles);
      }
    } catch (error) {
      console.error('Failed to load recent vehicles:', error);
    }
  };

  const runScraper = async () => {
    setIsScrapingRunning(true);
    try {
      const workerUrl = process.env.NEXT_PUBLIC_LAMBERT_WORKER_URL || 
                       'https://lambert-scraper.nick-damato0011527.workers.dev';
      
      const response = await fetch(`${workerUrl}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Check which vehicles already exist in the database
        const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                           'https://vehicle-admin-api.nick-damato0011527.workers.dev';
        
        try {
          const existingResponse = await fetch(`${adminApiUrl}/api/admin/vehicles`);
          const existingVehicles = await existingResponse.json();
          
          if (result.vehicles && result.vehicles.length > 0) {
            const formattedVehicles = result.vehicles.map((v: any, index: number) => {
              const exists = existingVehicles.some((existing: any) => 
                (v.vin && existing.vin === v.vin) ||
                (v.stock_number && existing.stockNumber === v.stock_number)
              );
              
              return {
                id: `lam_${index}`,
                title: v.title || `${v.year} ${v.make} ${v.model}`,
                price: v.price || 0,
                year: v.year,
                make: v.make,
                model: v.model,
                vin: v.vin,
                stock: v.stock_number,
                images: v.images || [],
                status: exists ? 'existing' as const : 'new' as const,
                lastSynced: new Date().toISOString()
              };
            });
            
            // Count actual new vs existing vehicles
            const actualNewVehicles = formattedVehicles.filter((v: any) => v.status === 'new').length;
            const actualExistingVehicles = formattedVehicles.filter((v: any) => v.status === 'existing').length;
            
            // Update stats with correct counts
            setStats({
              vehiclesFound: result.stats?.vehiclesFound || formattedVehicles.length,
              imagesUploaded: result.stats?.imagesUploaded || 0,
              syncedToMain: result.stats?.syncedToMain || 0,
              newVehicles: actualNewVehicles,
              updatedVehicles: actualExistingVehicles,
              lastRun: new Date().toISOString(),
              status: 'success'
            });
            
            setRecentVehicles(formattedVehicles.slice(0, 10));
          }
        } catch (error) {
          console.error('Failed to check existing vehicles:', error);
        }
        
        alert(`Scraping complete! Found ${result.stats?.vehiclesFound || 0} vehicles.`);
      } else {
        alert('Scraping failed. Please try again.');
      }
    } catch (error) {
      console.error('Scraping error:', error);
      alert('Scraping failed. Please check the console for details.');
    } finally {
      setIsScrapingRunning(false);
    }
  };

  // Rest of the component remains the same...
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Component JSX continues... */}
    </div>
  );
}
