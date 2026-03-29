"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronLeft, ChevronRight, Truck, ShieldCheck, Tag, Package } from "lucide-react"
import { cn } from "@/lib/utils"

const SLIDES = [
  {
    tag:      "Bugüne Özel",
    headline: "Elektronikte",
    accent:   "%30 İndirim",
    sub:      "TechZone — sınırlı stok, kaçırma!",
    cta:      "Fırsatı Gör",
    href:     "/products?category=electronics",
    gradient: "from-blue-700 via-blue-600 to-cyan-500",
    img:      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900&h=500&fit=crop",
    badge:    "bg-cyan-400/20 text-cyan-100 border-cyan-400/30",
  },
  {
    tag:      "Yeni Sezon",
    headline: "Moda'da",
    accent:   "Yeni Koleksiyon",
    sub:      "Kıbrıs Moda — kadın & erkek giyim",
    cta:      "Koleksiyonu Keşfet",
    href:     "/products?category=fashion",
    gradient: "from-rose-600 via-pink-500 to-orange-400",
    img:      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&h=500&fit=crop",
    badge:    "bg-rose-400/20 text-rose-100 border-rose-400/30",
  },
  {
    tag:      "Haftanın Kampanyası",
    headline: "Spor & Outdoor'da",
    accent:   "Ücretsiz Kargo",
    sub:      "Spor Merkezi — tüm fitness ürünleri",
    cta:      "Spor Ürünlerine Bak",
    href:     "/products?category=sports",
    gradient: "from-green-700 via-emerald-600 to-teal-500",
    img:      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&h=500&fit=crop",
    badge:    "bg-emerald-400/20 text-emerald-100 border-emerald-400/30",
  },
  {
    tag:      "Güzellik Haftası",
    headline: "Cilt Bakımında",
    accent:   "%20 İndirim",
    sub:      "Güzellik Evi — doğal & organik bakım",
    cta:      "Ürünleri İncele",
    href:     "/products?category=beauty",
    gradient: "from-purple-700 via-violet-600 to-pink-500",
    img:      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=900&h=500&fit=crop",
    badge:    "bg-purple-400/20 text-purple-100 border-purple-400/30",
  },
]

const SIDE_ADS = [
  {
    tag:      "Flash Fırsat",
    title:    "Kulaklık",
    sub:      "En iyi markalar",
    href:     "/products?category=electronics",
    gradient: "from-sky-600 to-indigo-600",
    img:      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=200&fit=crop",
  },
  {
    tag:      "Yeni Gelenler",
    title:    "Çanta & Aksesuar",
    sub:      "Son koleksiyonlar",
    href:     "/products?category=fashion",
    gradient: "from-amber-500 to-orange-600",
    img:      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=200&fit=crop",
  },
]

const TRUST = [
  { icon: ShieldCheck, label: "Onaylı Satıcılar" },
  { icon: Truck,       label: "KKTC Kargo"       },
  { icon: Package,     label: "Güvenli Paket"    },
  { icon: Tag,         label: "En İyi Fiyat"      },
]

export function CyprusHero() {
  const [slide, setSlide]         = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((idx: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => { setSlide(idx); setAnimating(false) }, 250)
  }, [animating])

  const prev = useCallback(() => goTo((slide - 1 + SLIDES.length) % SLIDES.length), [slide, goTo])
  const next = useCallback(() => goTo((slide + 1) % SLIDES.length),                 [slide, goTo])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000)
  }, [])

  useEffect(() => { startTimer(); return () => { if (timerRef.current) clearInterval(timerRef.current) } }, [startTimer])

  const current = SLIDES[slide]

  return (
    <section className="bg-background border-b py-3 md:py-4">
      <div className="container mx-auto px-3 md:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] xl:grid-cols-[1fr_240px] gap-3">

          {/* Main slide */}
          <div
            className="relative overflow-hidden rounded-2xl min-h-[220px] md:min-h-[300px] lg:min-h-[340px] group cursor-pointer"
            onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current) }}
            onMouseLeave={startTimer}
          >
            <div className={cn("absolute inset-0 transition-opacity duration-500", animating ? "opacity-0" : "opacity-100")}>
              <Image src={current.img} alt={current.headline} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 75vw" priority />
              <div className={cn("absolute inset-0 bg-gradient-to-r opacity-80", current.gradient)} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            <div className={cn("relative z-10 flex flex-col justify-end h-full p-5 md:p-8 transition-all duration-300", animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0")}>
              <span className={cn("inline-flex items-center self-start text-xs font-semibold px-2.5 py-1 rounded-full border mb-3", current.badge)}>
                {current.tag}
              </span>
              <p className="text-white/80 text-sm md:text-base font-medium leading-none mb-1">{current.headline}</p>
              <h2 className="text-white text-3xl md:text-5xl font-black leading-none tracking-tight text-balance mb-2">{current.accent}</h2>
              <p className="text-white/70 text-xs md:text-sm mb-5">{current.sub}</p>
              <Link href={current.href} className="inline-flex items-center gap-2 self-start bg-white text-foreground font-semibold text-sm rounded-xl px-5 py-2.5 hover:bg-white/90 transition-colors shadow-lg">
                {current.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100" aria-label="Önceki">
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100" aria-label="Sonraki">
              <ChevronRight className="h-4 w-4 text-white" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} aria-label={`Slayt ${i + 1}`}
                  className={cn("rounded-full transition-all duration-300", i === slide ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70")} />
              ))}
            </div>

            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-20">
              <div key={slide} className="h-full bg-white/70" style={{ animation: "progressBar 5s linear both" }} />
            </div>
          </div>

          {/* Side ads */}
          <div className="hidden lg:flex flex-col gap-3">
            {SIDE_ADS.map((ad) => (
              <Link key={ad.href + ad.title} href={ad.href} className="relative overflow-hidden rounded-2xl flex-1 group min-h-[160px]">
                <Image src={ad.img} alt={ad.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="240px" />
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", ad.gradient)} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="relative z-10 flex flex-col justify-end h-full p-4">
                  <span className="text-white/70 text-[11px] font-medium tracking-wide uppercase mb-0.5">{ad.tag}</span>
                  <p className="text-white font-bold text-base leading-tight">{ad.title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{ad.sub}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-white/90 text-xs font-semibold group-hover:gap-2 transition-all">
                    {"Gör"} <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl border bg-secondary/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              {label}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes progressBar { from { width: 0% } to { width: 100% } }
      `}</style>
    </section>
  )
}
