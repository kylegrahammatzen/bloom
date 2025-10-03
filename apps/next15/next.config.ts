import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@bloom/client', '@bloom/react', '@bloom/core'],
  serverExternalPackages: ['argon2', 'mongoose', '@mapbox/node-pre-gyp'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('argon2', 'mongoose');
      config.module = config.module || {};
      config.module.noParse = config.module.noParse || [];
      config.module.noParse.push(/node_modules\/@mapbox\/node-pre-gyp/);
    }
    return config;
  },
};

export default nextConfig;
