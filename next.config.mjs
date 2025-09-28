/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  // Skip static generation for admin routes
  exportPathMap: async function (defaultPathMap) {
    // Remove admin routes from static export
    const paths = {};
    for (const [path, config] of Object.entries(defaultPathMap)) {
      if (!path.startsWith('/admin')) {
        paths[path] = config;
      }
    }
    return paths;
  }
};

export default nextConfig;
