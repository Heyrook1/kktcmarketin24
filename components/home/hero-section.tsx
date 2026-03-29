"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Truck, ShieldCheck, CreditCard, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/shared/search-bar"
import { HeroFloatingCards } from "@/components/home/hero-floating-cards"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Content */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <div>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mb-2">
                <MapPin className="h-4 w-4" />
                KKTC'nin Güvenilir Pazaryeri
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-balance">
                Tüm Satıcılar, Tek Adres
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed text-pretty max-w-xl mx-auto lg:mx-0">
                Kuzey Kıbrıs'ın en güvenilir satıcılarından kaliteli ürünler. Tek sepet, tek ödeme, sınırsız seçenek. Marketin24 ile güvenle alışveriş yapın.
              </p>
            </div>

            {/* Search — only shown below lg where the header inline bar is absent */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:hidden">
              <SearchBar />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button size="lg" asChild>
                <Link href="/urunler">
                  Ürünleri İncele
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/compare">Platformları Karşılaştır</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-5 w-5 text-primary" />
                <span>Hızlı Teslimat</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Onaylı Satıcılar</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-5 w-5 text-primary" />
                <span>Güvenli Ödeme</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl transform rotate-3" />
              <div className="absolute inset-0 bg-card rounded-3xl shadow-xl overflow-hidden flex items-center justify-center p-10">
                <Image
                  src="/images/kktc-marketin24-logo.png"
                  alt="KKTC Marketin24"
                  width={480}
                  height={480}
                  className="object-contain w-full h-full drop-shadow-2xl"
                  priority
                />
              </div>
              {/* Dynamic live floating cards */}
              <HeroFloatingCards />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
