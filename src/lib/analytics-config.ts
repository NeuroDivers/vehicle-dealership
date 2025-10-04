/**
 * Analytics Configuration
 * Handles switching between local in-memory APIs and D1 database APIs
 */

// Configuration for analytics API endpoints
export const ANALYTICS_CONFIG = {
  // Always use the Cloudflare Worker API
  API_BASE_URL: process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev',
};

/**
 * Get the appropriate API URL for analytics endpoints
 */
export function getAnalyticsApiUrl(endpoint: string): string {
  return `${ANALYTICS_CONFIG.API_BASE_URL}${endpoint}`;
}

/**
 * Analytics API endpoints
 */
export const ANALYTICS_ENDPOINTS = {
  VEHICLE_VIEWS: '/api/analytics/vehicle-views',
  SEARCH_QUERIES: '/api/analytics/track-search',
  LEADS: '/api/leads',
};

/**
 * Helper function to track vehicle views
 */
export async function trackVehicleView(vehicleData: {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  price: number;
  userAgent?: string;
  referrer?: string;
  url?: string;
}) {
  try {
    const response = await fetch(getAnalyticsApiUrl(ANALYTICS_ENDPOINTS.VEHICLE_VIEWS), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...vehicleData,
        userAgent: vehicleData.userAgent || navigator.userAgent,
        referrer: vehicleData.referrer || document.referrer,
        url: vehicleData.url || window.location.href,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to track vehicle view:', error);
    // Don't throw error to avoid breaking the user experience
    return { success: false, error };
  }
}

/**
 * Helper function to track search queries
 */
export async function trackSearchQuery(queryData: {
  query: string;
  resultCount: number;
  userAgent?: string;
  url?: string;
}) {
  try {
    const response = await fetch(getAnalyticsApiUrl(ANALYTICS_ENDPOINTS.SEARCH_QUERIES), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...queryData,
        userAgent: queryData.userAgent || navigator.userAgent,
        url: queryData.url || window.location.href,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to track search query:', error);
    // Don't throw error to avoid breaking the user experience
    return { success: false, error };
  }
}

/**
 * Helper function to submit leads
 */
export async function submitLead(leadData: {
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  inquiryType: string;
  preferredContact: string;
  leadScore: number;
  status?: string;
  source?: string;
  userAgent?: string;
  url?: string;
}) {
  try {
    const response = await fetch(getAnalyticsApiUrl(ANALYTICS_ENDPOINTS.LEADS), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...leadData,
        userAgent: leadData.userAgent || navigator.userAgent,
        url: leadData.url || window.location.href,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to submit lead:', error);
    throw error; // Throw error for lead submission as it's critical
  }
}

/**
 * Helper function to fetch analytics data
 */
export async function fetchAnalytics(endpoint: string, params?: Record<string, string>) {
  try {
    const url = new URL(getAnalyticsApiUrl(endpoint));
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    throw error;
  }
}
