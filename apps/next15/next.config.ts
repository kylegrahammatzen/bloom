import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@bloom/client', '@bloom/react'],
  serverExternalPackages: ['argon2', 'mongoose', '@mapbox/node-pre-gyp'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          argon2: 'commonjs argon2',
          mongoose: 'commonjs mongoose',
          '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
        });
      }
    }
    return config;
  },
};

export default nextConfig;
