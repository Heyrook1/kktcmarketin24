"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronLeft, ChevronRight, Truck, ShieldCheck, Tag, Package, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { vendors } from "@/lib/data/vendors"

const TRUST = [
  { icon: ShieldCheck, label: "Onaylı Satıcılar",  color: "text-blue-500"   },
  { icon: Truck,       label: "KKTC Kargo",         color: "text-green-500"  },
  { icon: Package,     label: "Güvenli Paket",      color: "text-purple-500" },
  { icon: Tag,         label: "En İyi Fiyat",        color: "text-primary"    },
]

export function CyprusHero() {
  const [slide, setSlide]         = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef<number | null>(null)

  const SLIDES = useMemo(() => {
    return vendors.slice(0, 4).map((v, i) => {
      const gradients = [
        "from-blue-700 via-blue-600 to-sky-400",
        "from-blue-800 via-indigo-600 to-blue-500",
        "from-sky-700 via-blue-600 to-cyan-500",
        "from-indigo-700 via-blue-600 to-sky-500",
      ]
      const badges = [
        "bg-sky-400/20 text-sky-100 border-sky-400/30",
        "bg-blue-400/20 text-blue-100 border-blue-400/30",
        "bg-cyan-400/20 text-cyan-100 border-cyan-400/30",
        "bg-indigo-400/20 text-indigo-100 border-indigo-400/30",
      ]
      return {
        tag: "Öne Çıkan Mağaza",
        headline: "Resmi Satıcı",
        accent: v.name,
        sub: v.description,
        cta: "Mağazayı İncele",
        href: `/vendor/${v.slug}`,
        gradient: gradients[i % gradients.length],
        img: v.coverImage,
        logo: v.logo,
        badge: badges[i % badges.length],
      }
    })
  }, [])

  const SIDE_ADS = useMemo(() => {
    return vendors.slice(4, 6).map((v, i) => {
      const gradients = [
        "from-sky-600 to-indigo-600",
        "from-blue-600 to-cyan-500"
      ]
      return {
        tag: "Popüler Satıcı",
        title: v.name,
        sub: v.description.substring(0, 40) + '...',
        href: `/vendor/${v.slug}`,
        gradient: gradients[i % gradients.length],
        img: v.coverImage,
        logo: v.logo,
      }
    })
  }, [])

  const goTo = useCallback((idx: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => { setSlide(idx); setAnimating(false) }, 300)
  }, [animating])

  const prev = useCallback(() => goTo((slide - 1 + SLIDES.length) % SLIDES.length), [slide, goTo, SLIDES.length])
  const next = useCallback(() => goTo((slide + 1) % SLIDES.length),                 [slide, goTo, SLIDES.length])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000)
  }, [SLIDES.length])

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [startTimer])

  const current = SLIDES[slide]

  return (
    <section className="bg-background border-b py-3 md:py-4">
      <div className="container mx-auto px-3 md:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] xl:grid-cols-[1fr_240px] gap-3">

          {/* ── Main slide ── */}
          <div
            className="relative overflow-hidden rounded-xl min-h-[220px] md:min-h-[300px] lg:min-h-[340px] group cursor-pointer"
            onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current) }}
            onMouseLeave={startTimer}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return
              const delta = touchStartX.current - e.changedTouches[0].clientX
              if (Math.abs(delta) > 50) delta > 0 ? next() : prev()
              touchStartX.current = null
            }}
          >
            {/* Split Graphic Layout Background */}
            <div className={cn(
              "absolute inset-0 flex transition-opacity duration-500",
              animating ? "opacity-0 scale-105" : "opacity-100 scale-100"
            )}>
              {/* Right Side: Image */}
              <div className="absolute right-0 top-0 bottom-0 w-full md:w-[65%]">
                <Image
                  src={current.img}
                  alt={current.headline}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 75vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/10 to-black/40" />
              </div>

              {/* Left Side: Graphic Color Overlay */}
              <div 
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-[80%] md:w-[65%] z-10 bg-gradient-to-br border-r border-white/10 shadow-[20px_0_30px_-15px_rgba(0,0,0,0.5)]",
                  current.gradient
                )}
                style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" }}
              >
                {/* Decorative shapes to mimic modern ads */}
                <svg className="absolute top-6 left-8 w-16 h-16 text-white/15 animate-[spin_20s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <svg className="absolute bottom-12 right-[25%] w-10 h-10 text-white/20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                {/* Subtle graphic pattern inside the colored area to look more "designed" */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Content */}
            <div className={cn(
              "relative z-20 flex flex-col justify-center h-full w-full md:w-[60%] p-6 md:p-10",
              "transition-all duration-400",
              animating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
            )}>
              <div className="flex items-center gap-3 mb-5">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-xl bg-background/50 backdrop-blur-md">
                  <Image src={current.logo} alt={current.accent} fill className="object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md mb-1 uppercase tracking-widest",
                    current.badge
                  )}>
                    <Store className="h-3 w-3" /> {current.tag}
                  </span>
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                    {current.headline}
                  </p>
                </div>
              </div>

              <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-4 drop-shadow-md">
                {current.accent}
              </h2>
              <p className="text-white/90 text-sm md:text-base font-medium mb-8 max-w-[90%] line-clamp-2 leading-relaxed">
                {current.sub}
              </p>

              <Link
                href={current.href}
                className={cn(
                  "inline-flex items-center gap-2 self-start rounded-full px-8 py-3.5 text-sm font-extrabold shadow-2xl",
                  "bg-white text-slate-900 hover:bg-slate-50 transition-all duration-200",
                  "hover:gap-3 hover:shadow-black/30 active:scale-95"
                )}
              >
                {current.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Nav buttons */}
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110"
              aria-label="Önceki"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110"
              aria-label="Sonraki"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Slayt ${i + 1}`}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === slide
                      ? "w-8 h-2.5 bg-white shadow-md"
                      : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
                  )}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20">
              <div
                key={slide}
                className="h-full bg-gradient-to-r from-white/60 to-white"
                style={{ animation: "heroProgress 5s linear both" }}
              />
            </div>
          </div>

          {/* ── Side ads ── */}
          <div className="hidden lg:flex flex-col gap-3">
            {SIDE_ADS.map((ad) => (
              <Link
                key={ad.href + ad.title}
                href={ad.href}
                className="relative overflow-hidden rounded-xl flex-1 group min-h-[160px]"
              >
                <Image
                  src={ad.img}
                  alt={ad.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="240px"
                />
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-85 transition-opacity duration-300 group-hover:opacity-90", ad.gradient)} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="relative z-10 flex flex-col justify-end h-full p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-md">
                      <Image src={ad.logo} alt={ad.title} fill className="object-cover" />
                    </div>
                    <span className="text-white/80 text-[10px] font-bold tracking-widest uppercase bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                      {ad.tag}
                    </span>
                  </div>
                  <p className="text-white font-bold text-lg leading-tight">{ad.title}</p>
                  <p className="text-white/70 text-xs mt-1 line-clamp-2">{ad.sub}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-white text-xs font-bold group-hover:gap-3 transition-all duration-200">
                    Mağazaya Git <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Trust strip ── */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          {TRUST.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border bg-card px-3.5 py-2.5 text-xs font-medium",
                "transition-all duration-200 hover:shadow-sm hover:border-primary/30 hover:-translate-y-0.5"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", color)} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes heroProgress {
          from { width: 0%; opacity: 0.6; }
          to   { width: 100%; opacity: 1; }
        }
      `}</style>
    </section>
  )
}
