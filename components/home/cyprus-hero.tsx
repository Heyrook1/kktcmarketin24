"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Truck, ShieldCheck, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/shared/search-bar"

/* ── Cyprus island silhouette drawn as an inline SVG path ──────────────── */
/* Simplified silhouette of Cyprus for decorative background watermark      */
function CyprusSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 260"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Main island body */}
      <path d="M60,170 C55,160 48,148 52,136 C56,124 68,118 80,112
               C92,106 108,102 122,96 C136,90 148,80 164,76
               C180,72 196,74 210,70 C224,66 234,56 248,52
               C262,48 278,50 292,54 C306,58 318,66 330,72
               C342,78 356,82 368,88 C380,94 390,102 400,110
               C410,118 418,128 424,140 C430,152 432,166 428,178
               C424,190 414,198 402,204 C390,210 376,212 362,214
               C348,216 334,216 320,212 C306,208 294,200 280,196
               C266,192 250,192 236,194 C222,196 208,202 194,204
               C180,206 166,204 152,198 C138,192 126,182 114,176
               C102,170 90,168 78,170 C70,171 64,172 60,170 Z" />
      {/* Karpaz peninsula (the finger pointing NE) */}
      <path d="M390,92 C400,82 412,72 426,66 C440,60 454,58 466,52
               C478,46 488,36 496,30 C504,24 510,22 514,26
               C518,30 512,40 504,50 C496,60 484,68 472,76
               C460,84 448,90 436,96 C424,102 412,106 400,108
               C392,109 386,100 390,92 Z" />
    </svg>
  )
}

/* ── Trust badge data ───────────────────────────────────────────────────── */
const trustBadges = [
  {
    icon: Truck,
    label: "KKTC'ye Ücretsiz Kargo",
    sub: "Tüm siparişlerde",
    delay: "0ms",
  },
  {
    icon: ShieldCheck,
    label: "SSL Güvenli Alışveriş",
    sub: "256-bit şifreleme",
    delay: "80ms",
  },
  {
    icon: Clock,
    label: "1-3 Günde Teslimat",
    sub: "Hızlı & güvenilir",
    delay: "160ms",
  },
]

/* ── Component ──────────────────────────────────────────────────────────── */
export function CyprusHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /* Subtle particle animation on the canvas */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf: number
    const particles: { x: number; y: number; r: number; dx: number; dy: number; a: number }[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.4,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        a: Math.random() * 0.5 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(192, 86, 42, ${p.a})`
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#1E120A" }}
    >
      {/* ── Animated gradient overlay ─────────────────────────────────── */}
      <div
        className="absolute inset-0 animate-gradient-drift"
        style={{
          background:
            "linear-gradient(135deg, #2C1810 0%, #3D1E0E 30%, #C0562A22 60%, #2C1810 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── Particle canvas ───────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Cyprus silhouette watermark ───────────────────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none select-none"
        aria-hidden="true"
      >
        <CyprusSilhouette className="animate-float-slow w-[min(640px,90vw)] opacity-[0.07] text-[#E8D5B7]" />
      </div>

      {/* ── Warm light blobs ──────────────────────────────────────────── */}
      <div
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(192,86,42,0.18)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 right-0 w-[360px] h-[360px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(232,213,183,0.08)" }}
        aria-hidden="true"
      />

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="relative container mx-auto px-4 py-20 md:py-28 lg:py-36">
        <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">

          {/* Origin badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium animate-badge-in"
            style={{
              borderColor: "rgba(192,86,42,0.5)",
              background: "rgba(192,86,42,0.12)",
              color: "#E8C4A0",
              animationDelay: "0ms",
            }}
          >
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            Kuzey Kıbrıs Türk Cumhuriyeti
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <p
              className="text-sm md:text-base font-semibold tracking-widest uppercase"
              style={{ color: "#C0562A" }}
            >
              Marketin24
            </p>
            <h1
              className="text-balance font-black leading-[1.08] tracking-tight"
              style={{ color: "#FAF6F0" }}
            >
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                KKTC'nin En
              </span>
              <span
                className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
                style={{
                  color: "#C0562A",
                  textShadow: "0 0 60px rgba(192,86,42,0.35)",
                }}
              >
                Güvenilir
              </span>
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                Pazaryeri
              </span>
            </h1>
          </div>

          {/* Sub-headline */}
          <p
            className="text-pretty text-base md:text-lg leading-relaxed max-w-xl"
            style={{ color: "rgba(232,213,183,0.80)" }}
          >
            Kıbrıs'ın yerel satıcılarından kaliteli ürünler. Tek sepet, tek
            ödeme, hızlı teslimat. Güvenle alışveriş yapın.
          </p>

          {/* Search bar */}
          <div className="w-full max-w-lg">
            <div
              className="rounded-xl p-1 shadow-2xl ring-1"
              style={{ background: "#FAF6F0", ringColor: "rgba(192,86,42,0.2)" }}
            >
              <SearchBar />
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
            {/* Primary — solid terracotta orange */}
            <Button
              size="lg"
              className="w-full sm:w-auto min-w-[200px] font-bold text-base shadow-lg shadow-[#C0562A]/30 transition-all hover:shadow-xl hover:shadow-[#C0562A]/40 hover:scale-[1.02]"
              style={{
                background: "#C0562A",
                color: "#FAF6F0",
                border: "none",
              }}
              asChild
            >
              <Link href="/products">
                Alışverişe Başla
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            {/* Secondary — outlined */}
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto min-w-[200px] font-semibold text-base transition-all hover:scale-[1.02]"
              style={{
                borderColor: "rgba(232,213,183,0.35)",
                color: "#E8D5B7",
                background: "rgba(232,213,183,0.06)",
              }}
              asChild
            >
              <Link href="/vendors">Satıcıları Keşfet</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="w-full max-w-2xl">
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2"
            >
              {trustBadges.map(({ icon: Icon, label, sub, delay }) => (
                <div
                  key={label}
                  className="animate-badge-in flex items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 ring-inset"
                  style={{
                    background: "rgba(232,213,183,0.06)",
                    ringColor: "rgba(232,213,183,0.12)",
                    animationDelay: delay,
                    animationFillMode: "both",
                  }}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "rgba(192,86,42,0.20)" }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color: "#C0562A" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight" style={{ color: "#FAF6F0" }}>
                      {label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(232,213,183,0.60)" }}>
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
