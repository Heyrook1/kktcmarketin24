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
              Your trusted multi-vendor marketplace. Shop from verified sellers with confidence. Quality products, competitive prices, unified checkout.
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
            <h3 className="mb-4 text-sm font-semibold">Categories</h3>
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
            <h3 className="mb-4 text-sm font-semibold">Quick Links</h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/products?featured=true"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Featured Products
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Shopping Cart
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Become a Vendor
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Contact Us</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Istanbul, Turkey
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href="tel:+902121234567"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  +90 212 123 4567
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
            &copy; {new Date().getFullYear()} Marketin24. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
