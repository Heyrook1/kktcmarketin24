"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Tag, Percent, Truck, Minus, ChevronDown, Check, X, Sparkles, Loader2, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import type { Coupon, Gift as GiftType } from "@/lib/store/account-store"
import type { CouponResult } from "@/lib/store/cart-store"

// ── helpers ──────────────────────────────────────────────────────────────────

function couponIcon(type: Coupon["type"]) {
  if (type === "percent")       return <Percent className="h-3.5 w-3.5" />
  if (type === "free_shipping") return <Truck className="h-3.5 w-3.5" />
  return <Minus className="h-3.5 w-3.5" />
}

function couponLabel(type: Coupon["type"], value: number) {
  if (type === "percent")       return `%${value} İndirim`
  if (type === "free_shipping") return "Ücretsiz Kargo"
  return `${formatPrice(value)} İndirim`
}

function daysUntilExpiry(expiresAt: string) {
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
  if (diff < 0)  return null
  if (diff === 0) return "Bugün son gün!"
  if (diff === 1) return "Yarın son gün!"
  if (diff <= 7)  return `${diff} gün kaldı`
  return null // far future — don't show
}

export interface CouponPickerProps {
  /** All active coupons from the user's account */
  coupons: Coupon[]
  /** Gift cards from the user's account */
  gifts: GiftType[]
  /** Current cart subtotal, used to check minOrderAmount */
  subtotal: number
  /** Whether a coupon is already applied (disables the picker) */
  appliedCoupon: Extract<CouponResult, { valid: true }> | null
  /** Called when user selects or types and submits a code */
  onApply: (code: string) => CouponResult
  /** Called when user removes the applied coupon */
  onRemove: () => void
  /** Whether the user is logged in */
  isLoggedIn: boolean
}

export function CouponPicker({
  coupons,
  gifts,
  subtotal,
  appliedCoupon,
  onApply,
  onRemove,
  isLoggedIn,
}: CouponPickerProps) {
  const [inputValue, setInputValue]   = useState("")
  const [isOpen, setIsOpen]           = useState(false)
  const [error, setError]             = useState("")
  const [loading, setLoading]         = useState(false)
  const [autoBanner, setAutoBanner]   = useState<string | null>(null)
  const containerRef                  = useRef<HTMLDivElement>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)

  // Eligible = active, not used, minOrderAmount met
  const eligible = coupons.filter(
    (c) => c.isActive && !c.usedAt && subtotal >= c.minOrderAmount
  )

  // Eligible gifts (unused)
  const eligibleGifts = gifts.filter((g) => !g.isUsed)

  // ── Auto-apply best eligible coupon on mount ────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || appliedCoupon || eligible.length === 0) return
    // Pick best: prefer highest fixed saving
    const best = [...eligible].sort((a, b) => {
      const savingA = a.type === "percent" ? subtotal * a.value / 100
                    : a.type === "fixed"   ? a.value
                    : 30 // flat bonus for free_shipping
      const savingB = b.type === "percent" ? subtotal * b.value / 100
                    : b.type === "fixed"   ? b.value
                    : 30
      return savingB - savingA
    })[0]
    const result = onApply(best.code)
    if (result.valid) {
      setAutoBanner(best.code)
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    document.addEventListener("touchstart", handle)
    return () => {
      document.removeEventListener("mousedown", handle)
      document.removeEventListener("touchstart", handle)
    }
  }, [])

  const handleApply = useCallback(async (code?: string) => {
    const target = (code ?? inputValue).trim()
    if (!target) return
    setLoading(true)
    setError("")
    await new Promise((r) => setTimeout(r, 500))
    const result = onApply(target)
    setLoading(false)
    if (!result.valid) {
      setError(result.message)
    } else {
      setInputValue("")
      setIsOpen(false)
    }
  }, [inputValue, onApply])

  // ── Applied state ─────────────────────────────────────────────────────────
  if (appliedCoupon) {
    return (
      <div className="space-y-2">
        {/* Auto-applied banner */}
        {autoBanner === appliedCoupon.code && (
          <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span className="text-primary font-medium leading-snug">
              Hesabınızdaki en iyi kupon otomatik uygulandı!
            </span>
            <button
              type="button"
              onClick={() => setAutoBanner(null)}
              className="ml-auto text-primary/60 hover:text-primary transition-colors shrink-0"
              aria-label="Bildirimi kapat"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Applied chip */}
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Check className="h-4 w-4 text-green-600 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-green-800 dark:text-green-400 truncate">
                {appliedCoupon.code}
              </p>
              <p className="text-xs text-green-700 dark:text-green-500 truncate">
                {appliedCoupon.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-green-700 hover:text-red-500 transition-colors ml-3 shrink-0"
            aria-label="Kuponu kaldır"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── Picker state ──────────────────────────────────────────────────────────
  const allItems = [
    ...eligible.map((c) => ({ kind: "coupon" as const, item: c })),
    ...eligibleGifts.map((g) => ({ kind: "gift" as const, item: g })),
  ]

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">İndirim Kodu</p>
        {isLoggedIn && allItems.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
            <Tag className="h-3 w-3" />
            {allItems.length} kupon mevcut
          </span>
        )}
      </div>

      {/* Input + button */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value.toUpperCase()); setError("") }}
            onFocus={() => allItems.length > 0 && setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleApply() }
              if (e.key === "Escape") setIsOpen(false)
            }}
            placeholder="Kupon kodu girin"
            maxLength={20}
            autoComplete="off"
            className={cn(
              "w-full h-9 rounded-xl border bg-background px-3 pr-8 text-sm uppercase tracking-wide",
              "placeholder:text-muted-foreground placeholder:normal-case placeholder:tracking-normal",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition",
              error && "border-red-400 focus-visible:ring-red-400/50"
            )}
            aria-label="İndirim kodu"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          />
          {allItems.length > 0 && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => { setIsOpen((v) => !v); inputRef.current?.focus() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Kuponları göster"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleApply()}
          disabled={loading || !inputValue.trim()}
          className="shrink-0 rounded-xl"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Uygula"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="h-3 w-3 shrink-0" />{error}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && allItems.length > 0 && (
        <div
          role="listbox"
          aria-label="Kullanılabilir kuponlar"
          className={cn(
            "absolute z-50 w-full rounded-xl border bg-popover shadow-lg",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            "max-h-72 overflow-y-auto overscroll-contain"
          )}
          style={{ minWidth: containerRef.current?.offsetWidth }}
        >
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Kullanılabilir Kuponlar
            </p>
          </div>

          {allItems.map(({ kind, item }) => {
            if (kind === "coupon") {
              const c = item as Coupon
              const expiry = daysUntilExpiry(c.expiresAt)
              return (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => handleApply(c.code)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-accent transition-colors text-left group border-b last:border-b-0"
                >
                  {/* Icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {couponIcon(c.type)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-foreground tracking-widest">
                        {c.code}
                      </span>
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                        {couponLabel(c.type, c.value)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.description}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {c.minOrderAmount > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          Min. {formatPrice(c.minOrderAmount)}
                        </span>
                      )}
                      {expiry && (
                        <span className={cn(
                          "text-[10px] font-medium",
                          expiry.includes("Bugün") || expiry.includes("Yarın")
                            ? "text-red-500"
                            : "text-amber-600"
                        )}>
                          {expiry}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Apply cue */}
                  <span className="text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Uygula
                  </span>
                </button>
              )
            }

            // Gift
            const g = item as GiftType
            const expiry = daysUntilExpiry(g.expiresAt)
            return (
              <button
                key={g.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => handleApply(g.code)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-accent transition-colors text-left group border-b last:border-b-0"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                  <Gift className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-foreground tracking-widest">{g.code}</span>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-900/30 rounded-full px-2 py-0.5">
                      {formatPrice(g.amount)} Hediye
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{g.message}</p>
                  {expiry && (
                    <span className="text-[10px] font-medium text-amber-600">{expiry}</span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  Uygula
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
