/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Recommended for modern Next.js projects
    appDir: true,
  },
};

export default nextConfig;
