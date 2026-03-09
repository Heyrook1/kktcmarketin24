"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getFeaturedAds } from "@/lib/data/brand-ads"
import { cn } from "@/lib/utils"

export function LiveBrandAds() {
  const ads = getFeaturedAds()
  const [current, setCurrent] = useState(0)
  const [paused, setPaused]   = useState(false)

  const prev = useCallback(() => setCurrent((c) => (c - 1 + ads.length) % ads.length), [ads.length])
  const next = useCallback(() => setCurrent((c) => (c + 1) % ads.length), [ads.length])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [paused, next])

  // Build a window of 3 visible cards: [prev, current, next]
  const indices = [
    (current - 1 + ads.length) % ads.length,
    current,
    (current + 1) % ads.length,
  ]

  return (
    <section
      className="py-8 md:py-10 bg-secondary/40 border-b"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-4">

        {/* Section label */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Canlı Kampanyalar
            </h2>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon"
              className="h-8 w-8 rounded-full"
              onClick={prev} aria-label="Önceki"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="icon"
              className="h-8 w-8 rounded-full"
              onClick={next} aria-label="Sonraki"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Three-card rail */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {indices.map((adIdx, position) => {
            const ad      = ads[adIdx]
            const isFocus = position === 1   // middle card = hero

            return (
              <Link
                key={ad.id + position}
                href={ad.link}
                onClick={() => { if (position === 0) prev(); else if (position === 2) next() }}
                className={cn(
                  "group relative flex overflow-hidden rounded-2xl transition-all duration-300",
                  isFocus
                    ? "shadow-xl ring-2 ring-primary/20 scale-[1.02] md:h-40"
                    : "opacity-75 hover:opacity-90 md:h-36",
                  "h-28"
                )}
              >
                {/* Gradient bg */}
                <div className={cn("absolute inset-0", ad.backgroundColor)} />

                {/* Decorative image blend */}
                <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden">
                  <Image
                    src={ad.logo}
                    alt={ad.brandName}
                    fill
                    className="object-cover opacity-30 mix-blend-overlay scale-110"
                    sizes="80px"
                  />
                </div>

                {/* Gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

                {/* Content */}
                <div className="relative z-10 flex w-full items-center gap-4 px-5">
                  {/* Logo */}
                  <div className={cn(
                    "flex-shrink-0 rounded-xl overflow-hidden bg-white/20 ring-2 ring-white/30",
                    isFocus ? "h-16 w-16" : "h-12 w-12"
                  )}>
                    <Image
                      src={ad.logo}
                      alt={ad.brandName}
                      width={isFocus ? 64 : 48}
                      height={isFocus ? 64 : 48}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-white/80 truncate", isFocus ? "text-xs" : "text-[11px]")}>
                      {ad.brandName}
                    </p>
                    <p className={cn("text-white font-semibold truncate mt-0.5", isFocus ? "text-sm" : "text-xs")}>
                      {ad.tagline}
                    </p>
                  </div>

                  {/* Discount badge — always visible, large on focus */}
                  {ad.discount && (
                    <div className={cn(
                      "flex-shrink-0 flex items-center justify-center bg-white rounded-xl shadow-lg text-center leading-tight",
                      isFocus ? "px-4 py-2 min-w-[80px]" : "px-3 py-1.5 min-w-[64px]"
                    )}>
                      <span className={cn(
                        "font-black text-foreground",
                        isFocus ? "text-xl" : "text-sm"
                      )}>
                        {ad.discount}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Dot strip */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Kampanya ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-border hover:bg-muted-foreground"
              )}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
