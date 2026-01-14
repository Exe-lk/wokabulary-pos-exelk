import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript:{
    ignoreBuildErrors: true,
  },
  eslint:{
    ignoreDuringBuilds: true,
  },
  
  serverExternalPackages: ['@prisma/client', 'prisma'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  // Remove output standalone for Netlify
  // output: 'standalone',
  
  // Image optimization for Netlify
  images: {
    unoptimized: true,
    domains: ['localhost', 'wokabulary.netlify.app'],
  },
  
  // Ensure proper trailing slash handling
  trailingSlash: false,
  
  // Generate static exports for better Netlify compatibility
  distDir: '.next',
};

export default nextConfig;
