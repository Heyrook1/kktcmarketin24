/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Force a unique build ID each run to invalidate any stale module cache
  generateBuildId: async () => `build-${Date.now()}`,
}

export default nextConfig
