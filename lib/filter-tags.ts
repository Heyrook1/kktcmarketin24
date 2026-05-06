import type { Product } from "@/lib/data/products"
import { BRAND_TAGS } from "@/lib/tag-taxonomy"

export type FilterDimension = "gender" | "size" | "color" | "brand" | "type" | "subtype"

const PREFIX_RE = /^(gender|size|color|brand|type|subtype):(.+)$/

export interface AvailableFilters {
  genders:  string[]
  sizes:    string[]
  colors:   string[]
  brands:   string[]
  types:    string[]
  subtypes: string[]
  priceMin: number
  priceMax: number
}

export interface ActiveFilters {
  genders:  string[]
  sizes:    string[]
  colors:   string[]
  brands:   string[]
  types:    string[]
  subtypes: string[]
  priceMin: number
  priceMax: number
}

export function emptyActiveFilters(available: AvailableFilters): ActiveFilters {
  return {
    genders:  [],
    sizes:    [],
    colors:   [],
    brands:   [],
    types:    [],
    subtypes: [],
    priceMin: available.priceMin,
    priceMax: available.priceMax,
  }
}

export function isFiltersEmpty(active: ActiveFilters, available: AvailableFilters): boolean {
  return (
    active.genders.length  === 0 &&
    active.sizes.length    === 0 &&
    active.colors.length   === 0 &&
    active.brands.length   === 0 &&
    active.types.length    === 0 &&
    active.subtypes.length === 0 &&
    active.priceMin === available.priceMin &&
    active.priceMax === available.priceMax
  )
}

export function countActiveFilters(active: ActiveFilters, available: AvailableFilters): number {
  let n = active.genders.length + active.sizes.length + active.colors.length +
          active.brands.length  + active.types.length + active.subtypes.length
  if (active.priceMin !== available.priceMin || active.priceMax !== available.priceMax) n++
  return n
}

export function extractAvailableFilters(products: Product[]): AvailableFilters {
  const genders  = new Set<string>()
  const sizes    = new Set<string>()
  const colors   = new Set<string>()
  const brands   = new Set<string>()
  const types    = new Set<string>()
  const subtypes = new Set<string>()
  let priceMin = Infinity
  let priceMax = -Infinity

  for (const p of products) {
    if (p.price < priceMin) priceMin = p.price
    if (p.price > priceMax) priceMax = p.price

    for (const tag of p.tags ?? []) {
      const m = tag.match(PREFIX_RE)
      if (m) {
        const [, dim, val] = m
        switch (dim) {
          case "gender":  genders.add(val);  break
          case "size":    sizes.add(val);    break
          case "color":   colors.add(val);   break
          case "brand":   brands.add(val);   break
          case "type":    types.add(val);    break
          case "subtype": subtypes.add(val); break
        }
      } else if (BRAND_TAGS[tag]) {
        brands.add(tag)
      }
    }

    // Fallback to structured fields on the product
    for (const s of p.sizes ?? []) {
      if (s.available || s.stock > 0) sizes.add(s.size)
    }
    for (const c of p.colors ?? []) {
      if (c.stock > 0) colors.add(c.name.toLowerCase())
    }
  }

  return {
    genders:  [...genders].sort(),
    sizes:    sortSizes([...sizes]),
    colors:   [...colors].sort(),
    brands:   [...brands].sort((a, b) =>
      (BRAND_TAGS[a] ?? a).localeCompare(BRAND_TAGS[b] ?? b)),
    types:    [...types].sort(),
    subtypes: [...subtypes].sort(),
    priceMin: priceMin === Infinity  ?     0 : Math.floor(priceMin),
    priceMax: priceMax === -Infinity ? 10000 : Math.ceil(priceMax),
  }
}

const SIZE_ORDER: Record<string, number> = {
  XS: 0, xs: 0,
  S:  1, s:  1,
  M:  2, m:  2,
  L:  3, l:  3,
  XL: 4, xl: 4,
  XXL: 5, xxl: 5,
  XXXL: 6, xxxl: 6,
}

function sortSizes(sizes: string[]): string[] {
  return sizes.sort((a, b) => {
    const oa = SIZE_ORDER[a]
    const ob = SIZE_ORDER[b]
    if (oa !== undefined && ob !== undefined) return oa - ob
    if (oa !== undefined) return -1
    if (ob !== undefined) return 1
    const na = Number(a)
    const nb = Number(b)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b)
  })
}

export function applyFilters(products: Product[], active: ActiveFilters): Product[] {
  return products.filter((p) => {
    if (p.price < active.priceMin || p.price > active.priceMax) return false

    const prefixed = new Map<string, Set<string>>()
    const flat     = new Set<string>()

    for (const tag of p.tags ?? []) {
      const m = tag.match(PREFIX_RE)
      if (m) {
        const [, dim, val] = m
        if (!prefixed.has(dim)) prefixed.set(dim, new Set())
        prefixed.get(dim)!.add(val)
      } else {
        flat.add(tag)
      }
    }

    const productSizes = new Set([
      ...(prefixed.get("size") ?? []),
      ...(p.sizes?.filter((s) => s.available || s.stock > 0).map((s) => s.size) ?? []),
    ])

    const productColors = new Set([
      ...(prefixed.get("color") ?? []),
      ...(p.colors?.filter((c) => c.stock > 0).map((c) => c.name.toLowerCase()) ?? []),
    ])

    const productBrands = new Set([
      ...(prefixed.get("brand") ?? []),
      ...[...flat].filter((t) => BRAND_TAGS[t]),
    ])

    if (active.genders.length  > 0 && !active.genders.some((g)  => prefixed.get("gender")?.has(g)))   return false
    if (active.sizes.length    > 0 && !active.sizes.some((s)    => productSizes.has(s)))               return false
    if (active.colors.length   > 0 && !active.colors.some((c)   => productColors.has(c)))              return false
    if (active.brands.length   > 0 && !active.brands.some((b)   => productBrands.has(b)))              return false
    if (active.types.length    > 0 && !active.types.some((t)    => prefixed.get("type")?.has(t)))      return false
    if (active.subtypes.length > 0 && !active.subtypes.some((s) => prefixed.get("subtype")?.has(s)))   return false

    return true
  })
}
