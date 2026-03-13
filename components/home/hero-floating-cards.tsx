"use client"

import { useEffect, useState, useRef } from "react"
import { ShieldCheck, CreditCard, Users, TrendingUp, Star, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Deterministic seeding ────────────────────────────────────────────────────
function seedRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function useLiveCounter(initial: number, min: number, max: number, intervalMs: number) {
  const [count, setCount] = useState(initial)
  useEffect(() => {
    const tick = () => {
      const delta = Math.random() > 0.5 ? 1 : -1
      setCount((c) => Math.min(max, Math.max(min, c + delta)))
    }
    const id = setInterval(tick, intervalMs + Math.random() * 2000)
    return () => clearInterval(id)
  }, [min, max, intervalMs])
  return count
}

// ─── Individual floating card ─────────────────────────────────────────────────
interface FloatingCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  accent?: string
  className?: string
  delay?: number
}

function FloatingCard({ icon, label, value, subtext, accent = "bg-primary/10 text-primary", className, delay = 0 }: FloatingCardProps) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className={cn(
        "flex items-center gap-3 bg-card border border-border/60 rounded-2xl px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-sm",
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", accent)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground leading-none mb-1">{label}</p>
        <p className="text-base font-bold text-foreground leading-none font-heading tabular-nums">{value}</p>
        {subtext && <p className="text-[10px] text-muted-foreground mt-1 leading-none">{subtext}</p>}
      </div>
    </div>
  )
}

// ─── Live pulse dot ───────────────────────────────────────────────────────────
function LiveDot() {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
    </span>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function HeroFloatingCards() {
  const shoppers  = useLiveCounter(247, 190, 310, 4000)
  const orders    = useLiveCounter(18,  10,  30,  6500)
  const rng       = useRef(seedRandom(20240613))
  const [rating]  = useState(() => (4.6 + rng.current() * 0.3).toFixed(1))

  return (
    <>
      {/* Card 1 — live shoppers (left, mid-vertical) */}
      <FloatingCard
        icon={<Users className="h-5 w-5" />}
        label="Şu an alışveriş yapıyor"
        value={
          <span className="flex items-center gap-1.5">
            <LiveDot />
            {shoppers} kişi
          </span>
        }
        accent="bg-green-100 text-green-700"
        className="absolute -left-6 top-[22%] w-52 z-20"
        delay={400}
      />

      {/* Card 2 — orders last hour (right, top-ish) */}
      <FloatingCard
        icon={<TrendingUp className="h-5 w-5" />}
        label="Son 1 saatte sipariş"
        value={`${orders} sipariş`}
        subtext="Hızla artıyor"
        accent="bg-primary/10 text-primary"
        className="absolute -right-4 top-[12%] w-48 z-20"
        delay={700}
      />

      {/* Card 3 — verified sellers (right, bottom) */}
      <FloatingCard
        icon={<ShieldCheck className="h-5 w-5" />}
        label="Onaylı satıcı"
        value="8 satıcı"
        subtext="Hepsi doğrulandı"
        accent="bg-blue-100 text-blue-700"
        className="absolute -right-3 bottom-[18%] w-44 z-20"
        delay={1000}
      />

      {/* Card 4 — rating (left, bottom) */}
      <FloatingCard
        icon={<Star className="h-5 w-5" />}
        label="Ortalama memnuniyet"
        value={
          <span className="flex items-center gap-1">
            {rating}
            <span className="text-yellow-400 text-xs">★★★★★</span>
          </span>
        }
        subtext="2,400+ yorum"
        accent="bg-yellow-100 text-yellow-700"
        className="absolute -left-4 bottom-[8%] w-52 z-20"
        delay={1300}
      />

      {/* Card 5 — single checkout (left, very top) — smaller chip */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 -top-4 z-20",
          "flex items-center gap-2 bg-card border border-primary/30 rounded-full px-4 py-1.5 shadow-md",
          "animate-[fade-in_0.5s_1.6s_ease_both]"
        )}
      >
        <CreditCard className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">Tek Ödeme · Tüm Satıcılar</span>
      </div>
    </>
  )
}
