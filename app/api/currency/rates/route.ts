import { NextResponse } from "next/server"
import { fetchCurrencyRates } from "@/lib/currency-rates"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("force") === "1"
  const { payload, fallback } = await fetchCurrencyRates(force)

  const cacheControl = fallback
    ? "public, s-maxage=300, stale-while-revalidate=600"
    : "public, s-maxage=1800, stale-while-revalidate=3600"

  return NextResponse.json(
    fallback ? { ...payload, error: "Canlı kur servisi kullanılamadı. Yedek kurlar gösteriliyor." } : payload,
    { headers: { "Cache-Control": cacheControl } },
  )
}
