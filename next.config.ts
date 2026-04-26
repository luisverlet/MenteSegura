import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      root: '.',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://mentesegura.onrender.com/:path*',
      },
    ];
  },
};

export default nextConfig;
