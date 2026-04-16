"use client"

import { create } from "zustand"
import { persist } from "@/lib/zustand-middleware"

export type CurrencyCode = "TRY" | "USD" | "EUR" | "GBP"

export interface Currency {
  code: CurrencyCode
  symbol: string
  name: string
  locale: string
}

export const CURRENCIES: Currency[] = [
  { code: "TRY", symbol: "₺", name: "Türk Lirası", locale: "tr-TR" },
  { code: "USD", symbol: "$", name: "Amerikan Doları", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "İngiliz Sterlini", locale: "en-GB" },
]

const FALLBACK_RATES: Record<CurrencyCode, number> = {
  TRY: 1,
  USD: 0.031,
  EUR: 0.029,
  GBP: 0.025,
}

type RatesSource = "live" | "fallback"

interface CurrencyState {
  activeCurrency: Currency
  rates: Record<CurrencyCode, number>
  lastUpdatedAt: string | null
  ratesSource: RatesSource
  isLoading: boolean
  error: string | null
  setCurrency: (code: CurrencyCode) => void
  refreshRates: (force?: boolean) => Promise<void>
  convertFromTRY: (amountTRY: number) => number
  format: (amountTRY: number) => string
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      activeCurrency: CURRENCIES[0],
      rates: FALLBACK_RATES,
      lastUpdatedAt: null,
      ratesSource: "fallback",
      isLoading: false,
      error: null,

      setCurrency: (code) => {
        const currency = CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]
        set({ activeCurrency: currency })
      },

      refreshRates: async (force = false) => {
        const { isLoading, lastUpdatedAt } = get()
        if (isLoading) return

        // Avoid hammering API on every mount; refresh if stale (>30 min) unless forced.
        if (!force && lastUpdatedAt) {
          const ageMs = Date.now() - new Date(lastUpdatedAt).getTime()
          if (ageMs < 30 * 60 * 1000) return
        }

        set({ isLoading: true, error: null })
        try {
          const primaryEndpoint = force
            ? `/api/currency/rates?force=1&t=${Date.now()}`
            : "/api/currency/rates"

          const fallbackEndpoint = force
            ? `/api/currency?force=1&t=${Date.now()}`
            : "/api/currency"

          async function fetchRates(endpoint: string) {
            const response = await fetch(endpoint, { cache: "no-store" })
            const payload = await response.json().catch(() => ({})) as {
              rates?: Partial<Record<CurrencyCode, number>>
              fetchedAt?: string
              source?: RatesSource
              error?: string
            }
            return { response, payload }
          }

          let { response: res, payload } = await fetchRates(primaryEndpoint)
          if (res.status === 404) {
            const fallback = await fetchRates(fallbackEndpoint)
            res = fallback.response
            payload = fallback.payload
          }

          if (!res.ok || !payload.rates) {
            set({
              isLoading: false,
              error: payload.error ?? "Kur bilgisi güncellenemedi.",
              ratesSource: "fallback",
            })
            return
          }

          const nextRates: Record<CurrencyCode, number> = {
            TRY: Number(payload.rates.TRY ?? 1),
            USD: Number(payload.rates.USD ?? FALLBACK_RATES.USD),
            EUR: Number(payload.rates.EUR ?? FALLBACK_RATES.EUR),
            GBP: Number(payload.rates.GBP ?? FALLBACK_RATES.GBP),
          }

          const hasInvalid = Object.values(nextRates).some((v) => !Number.isFinite(v) || v <= 0)
          if (hasInvalid) {
            set({
              isLoading: false,
              error: "Geçersiz kur verisi alındı.",
              ratesSource: "fallback",
            })
            return
          }

          set({
            rates: nextRates,
            lastUpdatedAt: payload.fetchedAt ?? new Date().toISOString(),
            ratesSource: payload.source === "live" ? "live" : "fallback",
            isLoading: false,
            error: null,
          })
        } catch {
          set({
            isLoading: false,
            error: "Canlı kur servisine ulaşılamadı.",
            ratesSource: "fallback",
          })
        }
      },

      convertFromTRY: (amountTRY) => {
        const { activeCurrency, rates } = get()
        const rate = rates[activeCurrency.code] ?? 1
        return amountTRY * rate
      },

      format: (amountTRY) => {
        const { activeCurrency, convertFromTRY } = get()
        const converted = convertFromTRY(amountTRY)
        return new Intl.NumberFormat(activeCurrency.locale, {
          style: "currency",
          currency: activeCurrency.code,
          minimumFractionDigits: activeCurrency.code === "TRY" ? 0 : 2,
          maximumFractionDigits: activeCurrency.code === "TRY" ? 0 : 2,
        }).format(converted)
      },
    }),
    {
      name: "marketin24-currency",
      partialize: (s) => ({
        activeCurrency: s.activeCurrency,
        rates: s.rates,
        lastUpdatedAt: s.lastUpdatedAt,
        ratesSource: s.ratesSource,
      }),
    }
  )
)
