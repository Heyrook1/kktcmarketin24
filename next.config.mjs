/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack(config) {
    // Ensure zustand/middleware subpath resolves correctly with Turbopack/Webpack
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "zustand/middleware": require.resolve("zustand/middleware"),
    }
    return config
  },
}

export default nextConfig
