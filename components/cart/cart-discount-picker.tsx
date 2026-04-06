"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Tag, ChevronDown, Percent, Truck, Minus, Check, Loader2, X, Sparkles,
} from "lucide-react"
import { getUserCoupons } from "@/app/actions/coupons"
import type { Coupon } from "@/lib/store/account-store"
import type { CouponResult } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

function couponIcon(type: Coupon["type"]) {
  if (type === "percent") return <Percent className="h-3.5 w-3.5" />
  if (type === "free_shipping") return <Truck className="h-3.5 w-3.5" />
  return <Minus className="h-3.5 w-3.5" />
}

function couponLabel(type: Coupon["type"], value: number) {
  if (type === "percent") return `%${value} indirim`
  if (type === "free_shipping") return "Ücretsiz kargo"
  return `${formatPrice(value)} indirim`
}

export interface CartDiscountPickerProps {
  subtotal: number
  appliedCoupon: Extract<CouponResult, { valid: true }> | null
  applyCoupon: (code: string) => Promise<CouponResult>
  removeCoupon: () => void
}

export function CartDiscountPicker({
  subtotal,
  appliedCoupon,
  applyCoupon,
  removeCoupon,
}: CartDiscountPickerProps) {
  const [open, setOpen] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [myCoupons, setMyCoupons] = useState<Coupon[]>([])
  const [input, setInput] = useState("")
  const [busyCode, setBusyCode] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoadingList(true)
    getUserCoupons()
      .then((list) => {
        if (!cancelled) setMyCoupons(list)
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false)
      })
    return () => { cancelled = true }
  }, [])

  const usable = myCoupons.filter(
    (c) => c.isActive && !c.usedAt && new Date(c.expiresAt) > new Date(),
  )
  const eligible = usable.filter((c) => subtotal >= c.minOrderAmount)
  const locked = usable.filter((c) => subtotal < c.minOrderAmount)

  const apply = useCallback(
    async (code: string) => {
      const trimmed = code.trim()
      if (!trimmed) return
      setBusyCode(trimmed)
      setError("")
      const result = await applyCoupon(trimmed)
      setBusyCode(null)
      if (!result.valid) {
        setError(result.message)
        return
      }
      setInput("")
      setOpen(false)
    },
    [applyCoupon],
  )

  if (appliedCoupon) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/25 dark:border-emerald-800 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-700">
              <Check className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 font-mono tracking-wide">
                {appliedCoupon.code}
              </p>
              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-400/90 line-clamp-2">
                {appliedCoupon.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeCoupon}
            className="text-emerald-700 hover:text-destructive transition-colors p-1 shrink-0"
            aria-label="Kuponu kaldır"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          İndirim
        </p>
        {eligible.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            {eligible.length} kullanılabilir
          </span>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between h-10 rounded-xl border-dashed font-normal"
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4 text-primary" />
              {loadingList
                ? "Kuponlar yükleniyor…"
                : usable.length > 0
                  ? "Kayıtlı kuponlarımı seç"
                  : "İndirim kodu veya kupon seç"}
            </span>
            <ChevronDown className={cn("h-4 w-4 opacity-60 transition-transform", open && "rotate-180")} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-2rem,22rem)] p-0 rounded-xl border shadow-lg"
          align="start"
          sideOffset={6}
        >
          <div className="border-b px-3 py-2 bg-muted/40">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Hesabınızdaki kuponlar
            </p>
          </div>
          <ScrollArea className="max-h-[min(50vh,280px)]">
            {loadingList && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {!loadingList && usable.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                Kupon yok. Aşağıdan kod girebilirsiniz.
              </p>
            )}
            {eligible.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={busyCode === c.code}
                onClick={() => apply(c.code)}
                className="w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-accent/80 transition-colors border-b last:border-0 disabled:opacity-60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {couponIcon(c.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold tracking-wider">{c.code}</span>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      {couponLabel(c.type, c.value)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{c.description}</p>
                </div>
                {busyCode === c.code ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0 mt-1" />
                ) : (
                  <span className="text-[10px] font-medium text-primary shrink-0 mt-1">Uygula</span>
                )}
              </button>
            ))}
            {locked.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 px-3 py-3 border-b last:border-0 opacity-60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {couponIcon(c.type)}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold tracking-wider">{c.code}</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-500 mt-0.5">
                    Min. sepet {formatPrice(c.minOrderAmount)} — sepete ürün ekleyin
                  </p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <div className="flex gap-2">
        <Input
          placeholder="Kodu elle girin"
          value={input}
          onChange={(e) => { setInput(e.target.value.toUpperCase()); setError("") }}
          onKeyDown={(e) => e.key === "Enter" && apply(input)}
          className="h-9 text-sm rounded-xl uppercase font-mono tracking-wide"
          maxLength={24}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 rounded-xl"
          disabled={!input.trim() || busyCode !== null}
          onClick={() => apply(input)}
        >
          {busyCode && busyCode === input.trim().toUpperCase() ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Uygula"
          )}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
