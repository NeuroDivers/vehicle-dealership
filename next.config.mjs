/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  
  images: {
    unoptimized: true,
    domains: ['sltautos.com', 'imagedelivery.net']
  },
  
  eslint: {
    ignoreDuringBuilds: true
  },
  
  // Enable SWC minification (faster, modern)
  swcMinify: true,
  
  // Compiler optimizations for modern browsers
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
    // Remove React properties in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Experimental features for better performance
  experimental: {
    // Use modern module output (reduces bundle size)
    optimizePackageImports: ['lucide-react'],
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Compress output
  compress: true,
  
  // Optimize fonts
  optimizeFonts: true,
};

export default nextConfig;
