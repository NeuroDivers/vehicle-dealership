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
  // Compiler options for modern browsers
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

export default nextConfig;
