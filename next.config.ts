import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-ready configuration
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,
};

export default nextConfig;
