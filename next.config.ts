import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: false,
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
      };

      // Inject Buffer globally in every browser chunk that needs it
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
