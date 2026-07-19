/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow importing canonical fixtures from /data outside this package.
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
