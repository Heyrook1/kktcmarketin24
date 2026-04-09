"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ChevronDown, Check, RefreshCw, CircleDot } from "lucide-react"
import { useCurrencyStore, CURRENCIES, type CurrencyCode } from "@/lib/store/currency-store"
import { cn } from "@/lib/utils"

export function CurrencySelector() {
  const {
    activeCurrency,
    setCurrency,
    rates,
    ratesSource,
    isLoading,
    error,
    refreshRates,
  } = useCurrencyStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handle)
    return () => document.removeEventListener("keydown", handle)
  }, [])

  function select(code: CurrencyCode) {
    setCurrency(code)
    setOpen(false)
  }

  const rateLabel = useMemo(() => {
    const rate = rates[activeCurrency.code] ?? 1
    if (activeCurrency.code === "TRY") return "1 TRY = 1.00 TRY"
    return `1 TRY = ${rate.toFixed(4)} ${activeCurrency.code}`
  }, [activeCurrency.code, rates])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-sm font-medium transition-colors",
          "border border-border/60 bg-background hover:bg-secondary",
          open && "bg-secondary"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Para birimi seç"
      >
        <span className="font-bold text-primary tabular-nums">{activeCurrency.symbol}</span>
        <span className="hidden sm:inline text-xs text-muted-foreground font-medium">{activeCurrency.code}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Para birimleri"
          className={cn(
            "absolute right-0 top-full mt-1.5 z-50 w-52",
            "bg-card border border-border rounded-xl shadow-xl shadow-black/10",
            "py-1.5 overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
          )}
        >
          <p className="px-3 pt-1 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Para Birimi
          </p>
          {CURRENCIES.map((currency) => {
            const isActive = currency.code === activeCurrency.code
            return (
              <button
                key={currency.code}
                role="option"
                aria-selected={isActive}
                onClick={() => select(currency.code)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left",
                  isActive
                    ? "bg-primary/8 text-primary"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <span className="text-base font-bold w-5 text-center flex-shrink-0">{currency.symbol}</span>
                <span className="flex-1 min-w-0">
                  <span className="font-semibold">{currency.code}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground truncate">{currency.name}</span>
                </span>
                {isActive && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
              </button>
            )
          })}

          {/* Live rate status */}
          <div className="mx-3 mt-1 mb-1 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-muted-foreground leading-relaxed inline-flex items-center gap-1">
                <CircleDot className={cn("h-2.5 w-2.5", ratesSource === "live" ? "text-emerald-500" : "text-amber-500")} />
                {ratesSource === "live" ? "Canlı kur" : "Yedek kur"}
              </p>
              <button
                type="button"
                onClick={() => void refreshRates(true)}
                disabled={isLoading}
                className="inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                aria-label="Kurları yenile"
              >
                <RefreshCw className={cn("h-2.5 w-2.5", isLoading && "animate-spin")} />
                Yenile
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{rateLabel}</p>
            {error && <p className="text-[10px] text-amber-600 mt-0.5">{error}</p>}
            <p className="text-[10px] text-muted-foreground mt-1">
              Ödeme tahsilatı TRY üzerinden yapılır.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
