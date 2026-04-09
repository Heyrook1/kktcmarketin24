import { NextResponse } from "next/server"

export const runtime = "nodejs"

type CurrencyCode = "TRY" | "USD" | "EUR" | "GBP"

const FALLBACK_RATES: Record<CurrencyCode, number> = {
  TRY: 1,
  USD: 0.031,
  EUR: 0.029,
  GBP: 0.025,
}

const SUPPORTED_CODES = ["USD", "EUR", "GBP"] as const
const CACHE_TTL_MS = 30 * 60 * 1000

let memoryCache: {
  expiresAt: number
  payload: {
    base: "TRY"
    rates: Record<CurrencyCode, number>
    fetchedAt: string
    source: "live" | "fallback"
    provider: string
  }
} | null = null

function withTryBase(rates: Partial<Record<CurrencyCode, number>>): Record<CurrencyCode, number> {
  return {
    TRY: 1,
    USD: Number(rates.USD ?? FALLBACK_RATES.USD),
    EUR: Number(rates.EUR ?? FALLBACK_RATES.EUR),
    GBP: Number(rates.GBP ?? FALLBACK_RATES.GBP),
  }
}

function normalizeRates(rates: Record<CurrencyCode, number>): Record<CurrencyCode, number> | null {
  const invalid = Object.values(rates).some((v) => !Number.isFinite(v) || v <= 0)
  if (invalid) return null
  return {
    TRY: 1,
    USD: Number(rates.USD.toFixed(6)),
    EUR: Number(rates.EUR.toFixed(6)),
    GBP: Number(rates.GBP.toFixed(6)),
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const force = url.searchParams.get("force") === "1"
  const now = Date.now()
  if (!force && memoryCache && now < memoryCache.expiresAt) {
    return NextResponse.json(memoryCache.payload, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    })
  }

  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), 5000)

  try {
    const to = SUPPORTED_CODES.join(",")
    const response = await fetch(`https://api.frankfurter.app/latest?from=TRY&to=${to}`, {
      signal: abortController.signal,
      next: { revalidate: 1800 },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Rates provider returned ${response.status}`)
    }

    const data = await response.json() as {
      rates?: Partial<Record<CurrencyCode, number>>
      date?: string
    }
    const normalized = normalizeRates(withTryBase(data.rates ?? {}))
    if (!normalized) {
      throw new Error("Invalid currency payload")
    }

    const payload = {
      base: "TRY" as const,
      rates: normalized,
      fetchedAt: data.date ? new Date(`${data.date}T00:00:00Z`).toISOString() : new Date().toISOString(),
      source: "live" as const,
      provider: "frankfurter.app",
    }

    memoryCache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload,
    }

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    })
  } catch {
    clearTimeout(timeout)
    const payload = {
      base: "TRY" as const,
      rates: FALLBACK_RATES,
      fetchedAt: new Date().toISOString(),
      source: "fallback" as const,
      provider: "fallback",
    }

    memoryCache = {
      expiresAt: Date.now() + 5 * 60 * 1000,
      payload,
    }

    return NextResponse.json(
      { ...payload, error: "Canlı kur servisi kullanılamadı. Yedek kurlar gösteriliyor." },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      },
    )
  }
}

