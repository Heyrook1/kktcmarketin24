import { redirect } from "next/navigation"

// In Next.js 16, searchParams is a Promise — must be awaited before use.
export const revalidate = 0

export default async function ProductsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const qs = new URLSearchParams(params).toString()
  redirect(qs ? `/urunler?${qs}` : "/urunler")
}
