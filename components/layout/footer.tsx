"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react"
import { categories } from "@/lib/data/categories"
import { useT } from "@/lib/store/language-store"

export function Footer() {
  const t = useT()

  return (
    <footer className="border-t bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/">
              <Image
                src="/images/marketin24-logo.png"
                alt="Marketin24"
                width={140}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.footer.description}
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t.footer.categories}</h3>
            <ul className="flex flex-col gap-2">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t.footer.quickLinks}</h3>
            <ul className="flex flex-col gap-2">
              <li><Link href="/products" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.allProducts}</Link></li>
              <li><Link href="/compare" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.compare.title}</Link></li>
              <li><Link href="/cart" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.shoppingCart}</Link></li>
              <li>
                <Link href="/seller-application" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  {t.footer.becomeVendor}
                </Link>
              </li>
              <li><a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.helpCenter}</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t.footer.contact}</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Lefkoşa, KKTC</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href="tel:+903922281234" className="text-sm text-muted-foreground transition-colors hover:text-primary">+90 392 228 1234</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href="mailto:info@marketin24.com" className="text-sm text-muted-foreground transition-colors hover:text-primary">info@marketin24.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-12 border-t pt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-6">
            {t.hero.securePayment}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
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
              <span className="text-xs font-medium text-foreground">SSL</span>
              <span className="text-[11px] text-muted-foreground">256-bit</span>
            </div>
            <div className="h-12 w-px bg-border hidden md:block" aria-hidden="true"/>
            <div className="flex flex-col items-center gap-2 group">
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary border border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
                  <rect x="4" y="12" width="40" height="26" rx="5" fill="currentColor" className="text-primary" opacity="0.15"/>
                  <rect x="4" y="12" width="40" height="26" rx="5" stroke="currentColor" className="text-primary" strokeWidth="2.2"/>
                  <rect x="4" y="19" width="40" height="7" fill="currentColor" className="text-primary" opacity="0.25"/>
                  <rect x="10" y="28" width="10" height="3.5" rx="1.5" fill="currentColor" className="text-primary"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">{t.hero.securePayment}</span>
              <span className="text-[11px] text-muted-foreground">PCI-DSS</span>
            </div>
            <div className="h-12 w-px bg-border hidden md:block" aria-hidden="true"/>
            <div className="flex flex-col items-center gap-2 group">
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary border border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
                  <path d="M24 4C13.5 4 5 12.5 5 23c0 12.4 19 27 19 27s19-14.6 19-27C43 12.5 34.5 4 24 4z" fill="currentColor" className="text-primary" opacity="0.15" stroke="currentColor" strokeWidth="2.2"/>
                  <circle cx="24" cy="22" r="6" fill="currentColor" className="text-primary" opacity="0.3" stroke="currentColor" strokeWidth="2.2"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">{t.vendor.verified}</span>
              <span className="text-[11px] text-muted-foreground">KKTC</span>
            </div>
            <div className="h-12 w-px bg-border hidden md:block" aria-hidden="true"/>
            <div className="flex flex-col items-center gap-2 group">
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary border border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
                  <path d="M4 18h26v14H4z" fill="currentColor" className="text-primary" opacity="0.15"/>
                  <path d="M4 18h26v14H4z" stroke="currentColor" className="text-primary" strokeWidth="2.2" strokeLinejoin="round"/>
                  <path d="M30 22l8 3v7h-8V22z" fill="currentColor" className="text-primary" opacity="0.15" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
                  <circle cx="13" cy="33" r="3.5" fill="currentColor" className="text-primary"/>
                  <circle cx="36" cy="33" r="3.5" fill="currentColor" className="text-primary"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">{t.hero.fastDelivery}</span>
              <span className="text-[11px] text-muted-foreground">KKTC</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Marketin24. {t.footer.allRightsReserved}
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.privacyPolicy}</a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.termsOfService}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
