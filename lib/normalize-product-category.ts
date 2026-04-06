import { categories } from "@/lib/data/categories"

/** Maps any possible DB category value → canonical slug */
const CAT_MAP: Record<string, string> = {
  elektronik: "electronics",
  electronics: "electronics",
  moda: "fashion",
  fashion: "fashion",
  giyim: "fashion",
  "ev & bahçe": "home-garden",
  "ev ve bahçe": "home-garden",
  "home-garden": "home-garden",
  ev: "home-garden",
  bahçe: "home-garden",
  güzellik: "beauty",
  beauty: "beauty",
  kozmetik: "beauty",
  spor: "sports",
  sports: "sports",
  "spor & outdoor": "sports",
  "çocuk & bebek": "kids-baby",
  "kids-baby": "kids-baby",
  bebek: "kids-baby",
  çocuk: "kids-baby",
  "takı & aksesuar": "jewelry",
  jewelry: "jewelry",
  takı: "jewelry",
  aksesuar: "jewelry",
  "market & gıda": "groceries",
  groceries: "groceries",
  market: "groceries",
  gıda: "groceries",
  "sağlık & wellness": "health",
  health: "health",
  sağlık: "health",
  wellness: "health",
  "kitap & kırtasiye": "books",
  books: "books",
  kitap: "books",
  kırtasiye: "books",
}

export function normalizeCat(raw: string | null | undefined): string {
  if (!raw) return ""
  const lower = raw.toLowerCase().trim()
  if (CAT_MAP[lower]) return CAT_MAP[lower]
  const match = categories.find(
    (c) => c.id === lower || c.slug === lower || c.name.toLowerCase() === lower
  )
  return match?.id ?? lower
}
