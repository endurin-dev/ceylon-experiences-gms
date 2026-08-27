/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  experimental: {
    serverActions: { bodySizeLimit: "10mb" }, // allow Excel uploads
  },
};

export default nextConfig;
