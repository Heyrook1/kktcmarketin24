/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // Canonical login lives at /login; /auth/login is kept for old links and redirects here first (before route matching).
      { source: "/auth/login", destination: "/login", permanent: false },
      // Catch /products with any query string → /urunler (query is preserved automatically)
      { source: "/products",      destination: "/urunler",      permanent: false },
      { source: "/products/:path*", destination: "/urunler/:path*", permanent: false },
    ]
  },
}

export default nextConfig

