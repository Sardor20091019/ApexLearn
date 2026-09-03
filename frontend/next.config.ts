import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:4000/auth/:path*',
      },
      {
        source: '/courses/:path*',
        destination: 'http://localhost:4000/courses/:path*',
      },
      {
        source: '/upload/:path*',
        destination: 'http://localhost:4000/upload/:path*',
      },
    ];
  },
};

export default nextConfig;