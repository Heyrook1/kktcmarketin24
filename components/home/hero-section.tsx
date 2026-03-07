"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Truck, ShieldCheck, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/shared/search-bar"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Content */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <div>
              <span className="inline-block text-sm font-medium text-primary mb-2">
                Trusted Multi-Vendor Marketplace
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-balance">
                Shop from Verified Sellers, All in One Place
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed text-pretty max-w-xl mx-auto lg:mx-0">
                Discover quality products from trusted vendors. One cart, one checkout, countless choices. Shop with confidence at Marketin24.
              </p>
            </div>

            {/* Search */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <SearchBar />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button size="lg" asChild>
                <Link href="/products">
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/products?featured=true">View Featured</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-5 w-5 text-primary" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Verified Sellers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-5 w-5 text-primary" />
                <span>Secure Payment</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl transform rotate-3" />
              <div className="absolute inset-0 bg-card rounded-3xl shadow-xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=600&fit=crop"
                  alt="Shopping experience"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Floating card 1 */}
              <div className="absolute -left-8 top-1/4 bg-card rounded-lg shadow-lg p-3 border animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Verified Vendors</p>
                    <p className="text-xs text-muted-foreground">8+ trusted sellers</p>
                  </div>
                </div>
              </div>
              {/* Floating card 2 */}
              <div className="absolute -right-4 bottom-1/4 bg-card rounded-lg shadow-lg p-3 border">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Unified Checkout</p>
                    <p className="text-xs text-muted-foreground">Pay once, any vendor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
