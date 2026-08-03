/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" }, // allow Excel uploads
  },
};

export default nextConfig;
