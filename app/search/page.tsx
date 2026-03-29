import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchPageClient, SearchSkeleton } from "./search-client"

export const metadata: Metadata = {
  title: "Ürün Ara | Marketin24",
  description:
    "Marketin24'te binlerce ürün arasında arama yapın. Elektronik, moda, güzellik ve daha fazlası.",
  openGraph: {
    title: "Ürün Ara | Marketin24",
    description: "Onaylı satıcılardan ürün arayın.",
  },
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchPageClient />
    </Suspense>
  )
}
