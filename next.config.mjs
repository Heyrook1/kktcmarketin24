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
  async redirects() {
    return [
      // Catch /products with any query string → /urunler (query is preserved automatically)
      { source: "/products",      destination: "/urunler",      permanent: false },
      { source: "/products/:path*", destination: "/urunler/:path*", permanent: false },
    ]
  },
}

export default nextConfig

