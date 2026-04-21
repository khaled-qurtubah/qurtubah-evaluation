import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    '.space.z.ai',
    '.z.ai',
    '21.0.7.227',
    '127.0.0.1',
    'localhost',
  ],
};

export default nextConfig;
