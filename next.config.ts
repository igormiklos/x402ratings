import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // thread-stream bundles its own test helpers; Turbopack/Webpack might try to resolve them.
    // Alias them to false so they are excluded from the bundle.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "thread-stream/test": false,
      "thread-stream/test/helper": false,
      tap: false,
    };
    return config;
  },
};

export default nextConfig;
