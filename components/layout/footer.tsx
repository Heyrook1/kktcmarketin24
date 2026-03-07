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
                src="/images/marketin24-logo.png"
                alt="Marketin24"
                width={140}
                height={45}
                className="h-10 w-auto"
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
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Satıcı Ol
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Yardım Merkezi
                </a>
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
                  href="tel:+903922281234"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  +90 392 228 1234
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

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Marketin24. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Gizlilik Politikası
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Kullanım Koşulları
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
