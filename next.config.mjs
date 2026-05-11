import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/auth/login", destination: "/login", permanent: false },
      { source: "/urunler",        destination: "/products",        permanent: false },
      { source: "/urunler/:path*", destination: "/products/:path*", permanent: false },
    ]
  },
}

export default nextConfig

