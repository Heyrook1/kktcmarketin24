"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getFeaturedAds } from "@/lib/data/brand-ads"
import { cn } from "@/lib/utils"

export function LiveBrandAds() {
  const ads = getFeaturedAds()
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const prev = useCallback(() => setCurrent((c) => (c - 1 + ads.length) % ads.length), [ads.length])
  const next = useCallback(() => setCurrent((c) => (c + 1) % ads.length), [ads.length])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, 4500)
    return () => clearInterval(id)
  }, [paused, next])

  return (
    <section
      className="relative overflow-hidden bg-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Live pulse bar at top */}
      <div className="flex items-center justify-center gap-2 py-1.5 bg-primary">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-white">
          Canlı Kampanyalar
        </span>
      </div>

      {/* Slide track */}
      <div className="relative h-[200px] md:h-[220px]">
        {ads.map((ad, i) => (
          <Link
            key={ad.id}
            href={ad.link}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-500",
              i === current ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
          >
            <div className={cn("absolute inset-0", ad.backgroundColor)} />

            {/* Subtle shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-8 px-16 md:px-24 max-w-3xl w-full">
              {/* Logo */}
              <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl ring-4 ring-white/30 bg-white/10">
                <Image
                  src={ad.logo}
                  alt={ad.brandName}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>

              {/* Text block */}
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider truncate">
                  {ad.brandName}
                </p>
                <p className="text-white font-semibold text-lg md:text-xl leading-snug mt-0.5 truncate">
                  {ad.tagline}
                </p>
              </div>

              {/* Discount pill — the hero element */}
              {ad.discount && (
                <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white rounded-2xl px-5 py-3 shadow-2xl min-w-[96px]">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/50 leading-none">
                    Fırsat
                  </span>
                  <span className="text-2xl md:text-3xl font-black text-foreground leading-tight text-center">
                    {ad.discount}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}

        {/* Prev / Next */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.preventDefault(); prev() }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/20"
          aria-label="Önceki"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.preventDefault(); next() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/20"
          aria-label="Sonraki"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 pb-3">
        {ads.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setPaused(true); setTimeout(() => setPaused(false), 8000) }}
            aria-label={`Kampanya ${i + 1}`}
            className={cn(
              "rounded-full transition-all duration-300",
              i === current
                ? "w-6 h-2 bg-primary"
                : "w-2 h-2 bg-white/30 hover:bg-white/60"
            )}
          />
        ))}
      </div>
    </section>
  )
}
