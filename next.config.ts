import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript:{
    ignoreBuildErrors:true,
  },
  eslint:{
    ignoreDuringBuilds:true,
  },
  // Netlify specific configuration
  serverExternalPackages: ['@prisma/client', 'prisma']
};

export default nextConfig;
