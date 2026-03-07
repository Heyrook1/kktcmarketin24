import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileNav } from '@/components/layout/mobile-nav'
import './globals.css'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: 'Marketin24 - Multi-Vendor Marketplace',
    template: '%s | Marketin24'
  },
  description: 'Shop from verified vendors on Marketin24. Quality products, competitive prices, unified checkout. Your trusted multi-vendor marketplace.',
  keywords: ['marketplace', 'e-commerce', 'multi-vendor', 'online shopping', 'Turkey'],
  authors: [{ name: 'Marketin24' }],
  creator: 'Marketin24',
  icons: {
    icon: '/images/marketin24-logo.png',
    apple: '/images/marketin24-logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://marketin24.com',
    siteName: 'Marketin24',
    title: 'Marketin24 - Multi-Vendor Marketplace',
    description: 'Shop from verified vendors on Marketin24. Quality products, competitive prices, unified checkout.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketin24 - Multi-Vendor Marketplace',
    description: 'Shop from verified vendors on Marketin24. Quality products, competitive prices, unified checkout.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0066CC',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileNav />
        </div>
        <Analytics />
      </body>
    </html>
  )
}
