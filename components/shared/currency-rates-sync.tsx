"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useCurrencyStore } from "@/lib/store/currency-store"

export function CurrencyRatesSync() {
  const pathname = usePathname()
  const refreshRates = useCurrencyStore((s) => s.refreshRates)

  // Trigger a refresh check on route transitions.
  useEffect(() => {
    void refreshRates(false)
  }, [pathname, refreshRates])

  // Refresh when tab becomes active again or network comes back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshRates(false)
      }
    }
    const onOnline = () => {
      void refreshRates(true)
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onOnline)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onOnline)
    }
  }, [refreshRates])

  return null
}

