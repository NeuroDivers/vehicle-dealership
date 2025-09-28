// API Configuration
// This file manages the API endpoints for the application

// Vehicle API uses the original database with all the vehicle data
const VEHICLE_API_URL = 'https://vehicle-dealership-api.nick-damato0011527.workers.dev';

// Analytics API uses the new D1 database for analytics data
const ANALYTICS_API_URL = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-analytics.nick-damato0011527.workers.dev';

// Export the vehicle API URL to use throughout the app
export { VEHICLE_API_URL, ANALYTICS_API_URL };

// Helper function to get vehicle API endpoints
export const getVehicleEndpoint = (path: string = '') => {
  return `${VEHICLE_API_URL}/api/vehicles${path}`;
};

// Helper function to check if using D1 for analytics
export const isUsingD1Analytics = () => process.env.NEXT_PUBLIC_USE_D1_ANALYTICS === 'true';
