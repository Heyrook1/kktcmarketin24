"use client"

import { useState, useEffect, useRef } from "react"
import { Eye, ShoppingCart, AlertTriangle, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Deterministic hash — stable across renders, SSR-safe
// ---------------------------------------------------------------------------
function hash(str: string): number {
  return str.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

// ---------------------------------------------------------------------------
// Static data pools for the purchase toast
// ---------------------------------------------------------------------------
const NAMES  = ["Ahmet", "Mehmet", "Fatma", "Ayşe", "Ali", "Hasan", "Zeynep", "Mustafa", "Elif", "Emre"]
const CITIES = ["Lefkoşa", "Girne", "Gazimağusa", "Güzelyurt", "İskele", "Lefke"]

// ---------------------------------------------------------------------------
// COMPONENT 1 — ProductCardSocialProof
// ---------------------------------------------------------------------------
export interface ProductCardSocialProofProps {
  productId: string
  inStock: boolean
}

export function ProductCardSocialProof({ productId, inStock }: ProductCardSocialProofProps) {
  const base  = hash(productId) % 31 + 12          // 12–42
  const [viewers, setViewers] = useState(base)

  useEffect(() => {
    // Increment +1 every 30–45 s
    const delay = 30_000 + Math.random() * 15_000
    const id = setTimeout(function tick() {
      setViewers((v) => v + 1)
      const next = 30_000 + Math.random() * 15_000
      setTimeout(tick, next)
    }, delay)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Viewer count */}
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
        <Eye className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span aria-live="polite">
          <span className="font-medium tabular-nums">{viewers}</span> kişi inceledi
        </span>
      </span>

      {/* Out-of-stock badge */}
      {!inStock && (
        <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 leading-none">
          Tükendi
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// COMPONENT 2 — ProductDetailSocialProof
// ---------------------------------------------------------------------------
export interface ProductDetailSocialProofProps {
  productId: string
  selectedVariant: string | null
  inStock: boolean
}

export function ProductDetailSocialProof({
  productId,
  selectedVariant,
  inStock,
}: ProductDetailSocialProofProps) {
  const h = hash(productId)

  // Section A — viewer count
  const viewerBase = h % 24 + 8                    // 8–31
  const [viewers, setViewers] = useState(viewerBase)

  useEffect(() => {
    const delay = 20_000 + Math.random() * 15_000  // 20–35 s, set once
    const id = setTimeout(function tick() {
      setViewers((v) => v + 1)
      const next = 20_000 + Math.random() * 15_000
      setTimeout(tick, next)
    }, delay)
    return () => clearTimeout(id)
  }, [])

  // Section B — variant urgency
  const [prevVariant, setPrevVariant] = useState(selectedVariant)
  const [visible, setVisible]         = useState(!!selectedVariant)

  useEffect(() => {
    if (selectedVariant !== prevVariant) {
      if (selectedVariant) {
        setVisible(true)
      } else {
        setVisible(false)
      }
      setPrevVariant(selectedVariant)
    }
  }, [selectedVariant, prevVariant])

  const variantUrgency = (() => {
    if (!selectedVariant) return null
    const vh    = hash(productId + selectedVariant)
    const stock = vh % 7 + 1                       // 1–7
    if (stock <= 3) return { level: "critical" as const, stock, label: `${selectedVariant} renginde/bedeninde son ${stock} adet!` }
    if (stock <= 5) return { level: "low"      as const, stock, label: `${selectedVariant} için sadece ${stock} adet kaldı` }
    return null
  })()

  // Section C — sold today
  const soldToday = h % 14 + 2                     // 2–15

  // Section D — recent purchase toast
  const [toastVisible, setToastVisible] = useState(false)
  const [toastEntering, setToastEntering] = useState(false)
  const [toastName, setToastName]   = useState("")
  const [toastCity, setToastCity]   = useState("")
  const [toastMins, setToastMins]   = useState(0)
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    const delay = 5_000 + Math.random() * 4_000    // 5–9 s after load

    const showId = setTimeout(() => {
      setToastName(NAMES[Math.floor(Math.random() * NAMES.length)])
      setToastCity(CITIES[Math.floor(Math.random() * CITIES.length)])
      setToastMins(Math.floor(Math.random() * 17) + 2) // 2–18
      setToastEntering(true)
      setToastVisible(true)

      // Dismiss after 4 s
      setTimeout(() => {
        setToastEntering(false)
        setTimeout(() => setToastVisible(false), 300)
      }, 4_000)
    }, delay)

    return () => clearTimeout(showId)
  }, [])

  return (
    <>
      <div className="flex flex-col gap-2 py-1">

        {/* Section A — viewer count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className="relative flex h-2 w-2 shrink-0"
            aria-hidden="true"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span aria-live="polite">
            <span className="font-semibold tabular-nums text-foreground">{viewers}</span> kişi şu an bu ürünü inceliyor
          </span>
        </div>

        {/* Section B — variant urgency (animated slide-down) */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-150",
            visible && variantUrgency ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {variantUrgency && (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                variantUrgency.level === "critical"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-orange-50 text-orange-700 border border-orange-200"
              )}
            >
              {variantUrgency.level === "critical" ? (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Flame className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              {variantUrgency.label}
            </div>
          )}
        </div>

        {/* Section C — sold today */}
        {soldToday > 4 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Bugün <span className="font-semibold">{soldToday}</span> kişi satın aldı</span>
          </div>
        )}

      </div>

      {/* Section D — recent purchase toast (portal-style, fixed bottom-left) */}
      {toastVisible && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed bottom-24 left-4 z-50 flex items-start gap-3 rounded-xl border bg-card shadow-lg px-4 py-3 max-w-[280px] transition-all duration-300",
            toastEntering ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-0"
          )}
        >
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100">
            <ShoppingCart className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground leading-snug">
              <span className="font-semibold">{toastName}</span>{" "}
              <span className="text-muted-foreground">({toastCity})</span> bu ürünü{" "}
              <span className="font-semibold">{toastMins} dakika önce</span> satın aldı
            </p>
            <p className="text-[10px] text-green-600 font-medium mt-0.5">Dogrulandi ✓</p>
          </div>
        </div>
      )}
    </>
  )
}
