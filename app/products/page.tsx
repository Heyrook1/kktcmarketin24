import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ProductsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const qs = new URLSearchParams(params).toString()
  redirect(qs ? `/urunler?${qs}` : "/urunler")
}
