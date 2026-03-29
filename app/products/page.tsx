import { redirect } from "next/navigation"

// /products is permanently redirected to /urunler.
// This file exists only to satisfy Next.js App Router routing for the
// /products path — all real logic lives in app/urunler/page.tsx.
export default function ProductsRedirectPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const qs = new URLSearchParams(searchParams).toString()
  redirect(qs ? `/urunler?${qs}` : "/urunler")
}
