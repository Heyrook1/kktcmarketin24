import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react"
import { categories } from "@/lib/data/categories"
export function Footer() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/">
              <Image
                src="/images/kktc-marketin24-logo.png"
                alt="KKTC Marketin24"
                width={140}
                height={140}
                className="h-14 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              KKTC'nin güvenilir çoklu satıcı pazaryeri. Onaylı satıcılardan güvenle alışveriş yapın. Kaliteli ürünler, rekabetçi fiyatlar, tek ödeme.
            </p>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Kategoriler</h3>
            <ul className="flex flex-col gap-2">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Hızlı Erişim</h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Tüm Ürünler
                </Link>
              </li>
              <li>
                <Link
                  href="/compare"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Platform Karşılaştırması
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Alışveriş Sepeti
                </Link>
              </li>
              <li>
                <Link
                  href="/seller-application"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Satıcı Ol
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Yardım Merkezi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">İletişim</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Lefkoşa, KKTC
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href="tel:+905338734317"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  +90 533 873 43 17
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href="mailto:info@marketin24.com"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  info@marketin24.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-12 border-t pt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-6">
            Güvenli Alışveriş Güvencesi
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {/* SSL Secured */}
            <div className="flex flex-col items-center gap-2 group">
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary border border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
                  <rect x="8" y="20" width="32" height="22" rx="4" fill="currentColor" className="text-primary" opacity="0.15"/>
                  <rect x="8" y="20" width="32" height="22" rx="4" stroke="currentColor" className="text-primary" strokeWidth="2.2"/>
                  <path d="M16 20v-6a8 8 0 1 1 16 0v6" stroke="currentColor" className="text-primary" strokeWidth="2.2" strokeLinecap="round"/>
                  <circle cx="24" cy="31" r="3" fill="currentColor" className="text-primary"/>
                  <path d="M24 34v3" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">SSL Güvenli</span>
              <span className="text-[11px] text-muted-foreground">256-bit şifreleme</span>
            </div>

            <div className="h-12 w-px bg-border hidden md:block" aria-hidden="true"/>

            {/* Secure Payment */}
            <div className="flex flex-col items-center gap-2 group">
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary border border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
                  <rect x="4" y="12" width="40" height="26" rx="5" fill="currentColor" className="text-primary" opacity="0.15"/>
                  <rect x="4" y="12" width="40" height="26" rx="5" stroke="currentColor" className="text-primary" strokeWidth="2.2"/>
                  <rect x="4" y="19" width="40" height="7" fill="currentColor" className="text-primary" opacity="0.25"/>
                  <rect x="10" y="28" width="10" height="3.5" rx="1.5" fill="currentColor" className="text-primary"/>
                  <rect x="23" y="28" width="6" height="3.5" rx="1.5" fill="currentColor" className="text-primary" opacity="0.5"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">Güvenli Ödeme</span>
              <span className="text-[11px] text-muted-foreground">Kart bilgisi korunur</span>
            </div>

            <div className="h-12 w-px bg-border hidden md:block" aria-hidden="true"/>

            {/* KKTC Local Seller */}
            <div className="flex flex-col items-center gap-2 group">
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary border border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
                  <path d="M24 4C13.5 4 5 12.5 5 23c0 12.4 19 27 19 27s19-14.6 19-27C43 12.5 34.5 4 24 4z" fill="currentColor" className="text-primary" opacity="0.15" stroke="currentColor" strokeWidth="2.2"/>
                  <circle cx="24" cy="22" r="6" fill="currentColor" className="text-primary" opacity="0.3" stroke="currentColor" strokeWidth="2.2"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">Yerel KKTC Satıcı</span>
              <span className="text-[11px] text-muted-foreground">Onaylı mağazalar</span>
            </div>

            <div className="h-12 w-px bg-border hidden md:block" aria-hidden="true"/>

            {/* Fast Delivery */}
            <div className="flex flex-col items-center gap-2 group">
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary border border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
                  <path d="M4 18h26v14H4z" rx="2" fill="currentColor" className="text-primary" opacity="0.15"/>
                  <path d="M4 18h26v14H4z" stroke="currentColor" className="text-primary" strokeWidth="2.2" strokeLinejoin="round"/>
                  <path d="M30 22l8 3v7h-8V22z" fill="currentColor" className="text-primary" opacity="0.15" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
                  <circle cx="13" cy="33" r="3.5" fill="currentColor" className="text-primary"/>
                  <circle cx="36" cy="33" r="3.5" fill="currentColor" className="text-primary"/>
                  <path d="M8 13h14" stroke="currentColor" className="text-primary" strokeWidth="2.2" strokeLinecap="round" opacity="0.5"/>
                  <path d="M8 9h9" stroke="currentColor" className="text-primary" strokeWidth="2.2" strokeLinecap="round" opacity="0.3"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">Hızlı Teslimat</span>
              <span className="text-[11px] text-muted-foreground">Tüm KKTC'ye</span>
            </div>

            <div className="h-12 w-px bg-border hidden md:block" aria-hidden="true"/>

            {/* 24/7 Support */}
            <div className="flex flex-col items-center gap-2 group">
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary border border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
                  <circle cx="24" cy="24" r="18" fill="currentColor" className="text-primary" opacity="0.12" stroke="currentColor" strokeWidth="2.2"/>
                  <path d="M15 21c0-5 4-9 9-9s9 4 9 9" stroke="currentColor" className="text-primary" strokeWidth="2.2" strokeLinecap="round"/>
                  <rect x="11" y="21" width="5" height="8" rx="2.5" fill="currentColor" className="text-primary" opacity="0.3" stroke="currentColor" strokeWidth="2.2"/>
                  <rect x="32" y="21" width="5" height="8" rx="2.5" fill="currentColor" className="text-primary" opacity="0.3" stroke="currentColor" strokeWidth="2.2"/>
                  <path d="M36 29c0 3.3-2.7 6-6 6h-4" stroke="currentColor" className="text-primary" strokeWidth="2.2" strokeLinecap="round"/>
                  <circle cx="25" cy="35" r="2" fill="currentColor" className="text-primary"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">7/24 Destek</span>
              <span className="text-[11px] text-muted-foreground">Her zaman yanınızda</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Marketin24. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Gizlilik Politikası
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Kullanım Koşulları
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
