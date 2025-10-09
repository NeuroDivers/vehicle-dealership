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
  
  // Inline CSS for better performance (CSS is small ~47KB)
  // This eliminates render-blocking CSS requests
  experimental: {
    // Use modern module output (reduces bundle size)
    optimizePackageImports: ['lucide-react'],
    // Modern output targets
    modern: true,
    // Optimize CSS loading
    optimizeCss: false, // Let PostCSS handle it
  },
  
  // Enable SWC minification (faster, modern)
  swcMinify: true,
  
  // Compiler optimizations for modern browsers
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
    // Remove React properties in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    // Target modern browsers only (ES2020+)
    styledComponents: false,
    emotion: false,
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
