"use client"

import Link from "next/link"
import { ArrowRight, Truck, ShieldCheck, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/shared/search-bar"

/* ── Cyprus island silhouette — accurate simplified outline ─────────────── */
function CyprusSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 260"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Main body */}
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
      {/* Karpaz peninsula */}
      <path d="M390,92 C400,82 412,72 426,66 C440,60 454,58 466,52
               C478,46 488,36 496,30 C504,24 510,22 514,26
               C518,30 512,40 504,50 C496,60 484,68 472,76
               C460,84 448,90 436,96 C424,102 412,106 400,108
               C392,109 386,100 390,92 Z" />
    </svg>
  )
}

/* ── Trust badges ───────────────────────────────────────────────────────── */
const trustBadges = [
  { icon: Truck,       label: "KKTC'ye Ücretsiz Kargo", sub: "Tüm siparişlerde" },
  { icon: ShieldCheck, label: "SSL Güvenli Alışveriş",  sub: "256-bit şifreleme" },
  { icon: Clock,       label: "1–3 Günde Teslimat",     sub: "Hızlı & güvenilir" },
]

/* ── Component ──────────────────────────────────────────────────────────── */
export function CyprusHero() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#1E120A]"
      style={{ minHeight: "clamp(580px, 70vh, 800px)" }}
    >
      {/* ── Warm ambient blobs ────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(192,86,42,0.22) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(232,213,183,0.07) 0%, transparent 70%)" }}
      />

      {/* ── Cyprus map — right-side decorative, faint stroke + fill ───── */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-y-0 right-0 flex items-center pr-6 lg:pr-16"
      >
        <CyprusSilhouette className="animate-float-slow w-[min(460px,55vw)] opacity-[0.08] text-[#E8D5B7]" />
      </div>

      {/* ── Terracotta horizontal rule — top edge accent ──────────────── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: "linear-gradient(90deg, transparent 0%, #C0562A 30%, #C0562A 70%, transparent 100%)" }}
      />

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div
        className="relative container mx-auto px-4 flex items-center"
        style={{ minHeight: "inherit" }}
      >
        <div className="flex flex-col gap-7 max-w-2xl py-20 md:py-24">

          {/* Origin pill */}
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide uppercase"
            style={{ borderColor: "rgba(192,86,42,0.45)", background: "rgba(192,86,42,0.10)", color: "#E8C4A0" }}
          >
            <MapPin className="h-3 w-3 flex-shrink-0" />
            Kuzey Kıbrıs Türk Cumhuriyeti
          </div>

          {/* Headline — display serif for hierarchy */}
          <div>
            <p
              className="text-xs md:text-sm font-semibold tracking-[0.20em] uppercase mb-3"
              style={{ color: "#C0562A" }}
            >
              Marketin24
            </p>
            <h1
              className="font-serif text-balance leading-[1.05] tracking-tight"
              style={{ color: "#FAF6F0" }}
            >
              <span className="block text-[clamp(2.6rem,6.5vw,5rem)]">
                KKTC'nin En
              </span>
              <span
                className="block text-[clamp(3rem,8vw,6.25rem)] italic"
                style={{ color: "#C0562A", textShadow: "0 2px 40px rgba(192,86,42,0.30)" }}
              >
                Güvenilir
              </span>
              <span className="block text-[clamp(2.6rem,6.5vw,5rem)]">
                Pazaryeri
              </span>
            </h1>
          </div>

          {/* Subline — body, muted */}
          <p
            className="text-pretty text-base md:text-lg leading-relaxed max-w-lg font-sans"
            style={{ color: "rgba(232,213,183,0.72)" }}
          >
            Kıbrıs'ın yerel satıcılarından kaliteli ürünler. Tek sepet, tek ödeme, hızlı teslimat.
          </p>

          {/* Search */}
          <div className="w-full max-w-md">
            <div
              className="rounded-xl overflow-hidden ring-1 shadow-xl"
              style={{ background: "#FAF6F0", ringColor: "rgba(192,86,42,0.25)" }}
            >
              <SearchBar />
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="font-bold text-sm shadow-lg transition-all hover:scale-[1.02]"
              style={{ background: "#C0562A", color: "#FAF6F0", border: "none", boxShadow: "0 4px 24px rgba(192,86,42,0.35)" }}
              asChild
            >
              <Link href="/products">
                Alışverişe Başla
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-semibold text-sm transition-all hover:scale-[1.02]"
              style={{ borderColor: "rgba(232,213,183,0.30)", color: "#E8D5B7", background: "rgba(232,213,183,0.06)" }}
              asChild
            >
              <Link href="/vendors">Satıcıları Keşfet</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            {trustBadges.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "rgba(232,213,183,0.06)", outline: "1px solid rgba(232,213,183,0.10)" }}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(192,86,42,0.18)" }}
                >
                  <Icon className="h-4 w-4" style={{ color: "#C0562A" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: "#FAF6F0" }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(232,213,183,0.52)" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Bottom fade into page background ─────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-16"
        style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
      />
    </section>
  )
}
