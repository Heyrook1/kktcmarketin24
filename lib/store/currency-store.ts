"use client"

import { create } from "zustand"
import { persist } from "@/lib/zustand-middleware"

export type CurrencyCode = "TRY" | "USD" | "EUR" | "GBP"

export interface Currency {
  code: CurrencyCode
  symbol: string
  name: string
  locale: string
  /** Rate relative to TRY base (1 TRY = x currency). Updated manually until a live feed is wired. */
  rate: number
}

export const CURRENCIES: Currency[] = [
  { code: "TRY", symbol: "₺", name: "Türk Lirası",  locale: "tr-TR", rate: 1 },
  { code: "USD", symbol: "$", name: "Amerikan Doları", locale: "en-US", rate: 0.031 },
  { code: "EUR", symbol: "€", name: "Euro",           locale: "de-DE", rate: 0.029 },
  { code: "GBP", symbol: "£", name: "İngiliz Sterlini", locale: "en-GB", rate: 0.025 },
]

interface CurrencyState {
  activeCurrency: Currency
  setCurrency: (code: CurrencyCode) => void
  convertFromTRY: (amountTRY: number) => number
  format: (amountTRY: number) => string
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      activeCurrency: CURRENCIES[0],

      setCurrency: (code) => {
        const currency = CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]
        set({ activeCurrency: currency })
      },

      convertFromTRY: (amountTRY) => {
        const { activeCurrency } = get()
        return amountTRY * activeCurrency.rate
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
      partialize: (s) => ({ activeCurrency: s.activeCurrency }),
    }
  )
)
