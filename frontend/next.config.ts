import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Mark 'handlebars' as an external dependency to avoid webpack warnings.
    // This is because it's used on the server-side and doesn't need to be bundled.
    if (isServer) {
      config.externals.push('handlebars');
    }
    return config;
  },
};

export default nextConfig;
