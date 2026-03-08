"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Zap } from "lucide-react"
import { getFeaturedAds } from "@/lib/data/brand-ads"

export function LiveBrandAds() {
  const trackRef = useRef<HTMLDivElement>(null)
  const ads = getFeaturedAds()
  // Duplicate list so the marquee loops seamlessly
  const doubled = [...ads, ...ads]

  /* Pause on hover */
  const pause  = () => { if (trackRef.current) trackRef.current.style.animationPlayState = "paused"  }
  const resume = () => { if (trackRef.current) trackRef.current.style.animationPlayState = "running" }

  return (
    <section
      className="relative overflow-hidden border-y border-border/60 bg-secondary/40 py-5"
      aria-label="Marka kampanyaları"
    >
      {/* Live dot + label */}
      <div className="container mx-auto px-4 mb-4 flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Canlı Kampanyalar
        </p>
      </div>

      {/* Fade edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10"
        style={{ background: "linear-gradient(to right, var(--secondary) / 0.6, transparent)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10"
        style={{ background: "linear-gradient(to left, var(--secondary) / 0.6, transparent)" }}
      />

      {/* Marquee track */}
      <div
        ref={trackRef}
        className="flex gap-4 animate-marquee"
        style={{ width: "max-content" }}
        onMouseEnter={pause}
        onMouseLeave={resume}
      >
        {doubled.map((ad, i) => (
          <Link
            key={`${ad.id}-${i}`}
            href={ad.link}
            className="group flex-shrink-0 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
            style={{ minWidth: "220px" }}
            tabIndex={i >= ads.length ? -1 : 0}
            aria-hidden={i >= ads.length}
          >
            {/* Logo */}
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
              <Image src={ad.logo} alt={ad.brandName} fill className="object-cover" />
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{ad.brandName}</p>
              <p className="text-xs text-muted-foreground truncate">{ad.tagline}</p>
            </div>

            {/* Discount chip */}
            {ad.discount && (
              <div className="ml-auto flex-shrink-0 flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-xs font-bold text-primary whitespace-nowrap">{ad.discount}</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
