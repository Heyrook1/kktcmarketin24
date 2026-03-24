import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Inter, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Header } from '@/components/layout/site-header'
import { Footer } from '@/components/layout/footer'
import { MobileNav } from '@/components/layout/mobile-nav'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const syne  = Syne({ subsets: ["latin"], variable: "--font-syne", weight: ["400","500","600","700","800"] })

export const metadata: Metadata = {
  title: {
    default: 'Marketin24 - KKTC Pazaryeri',
    template: '%s | Marketin24'
  },
  description: 'KKTC\'nin güvenilir çoklu satıcı pazaryeri. Onaylı satıcılardan kaliteli ürünler, rekabetçi fiyatlar, tek ödeme. Kuzey Kıbrıs\'ta güvenle alışveriş yapın.',
  keywords: ['pazaryeri', 'e-ticaret', 'KKTC', 'Kuzey Kıbrıs', 'online alışveriş', 'Lefkoşa', 'Girne', 'marketplace'],
  authors: [{ name: 'Marketin24' }],
  creator: 'Marketin24',
  icons: {
    icon: '/images/kktc-marketin24-logo.png',
    apple: '/images/kktc-marketin24-logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://marketin24.com',
    siteName: 'Marketin24',
    title: 'Marketin24 - KKTC Pazaryeri',
    description: 'KKTC\'nin güvenilir çoklu satıcı pazaryeri. Onaylı satıcılardan kaliteli ürünler, rekabetçi fiyatlar.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketin24 - KKTC Pazaryeri',
    description: 'KKTC\'nin güvenilir çoklu satıcı pazaryeri. Onaylı satıcılardan kaliteli ürünler, rekabetçi fiyatlar.',
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
    <html lang="tr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          }
        `}</Script>
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'tr',
                includedLanguages: 'tr,en,ar,de,fr,es,it,ru,zh-CN,el,bg',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </Script>
      </head>
      <body className={`${inter.variable} ${syne.variable} font-sans antialiased`}>
        <div id="google_translate_element" className="hidden" />
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileNav />
          <PWAInstallPrompt />
        </div>
        <Analytics />
      </body>
    </html>
  )
}
