// lib/smart-search.ts
// Parses a free-form Turkish search query into structured filter intent.
// Used by: /api/search route, products-content autocomplete, breadcrumb chips.

export interface SearchIntent {
  category?: string      // taxonomy key e.g. "elektronik"
  categorySlug?: string  // category page slug e.g. "electronics"
  subcategory?: string   // subcategory tag e.g. "cep-telefonu"
  subcategorySlug?: string
  brand?: string         // brand tag e.g. "samsung"
  attributes: string[]   // attribute tags e.g. ["5g", "android"]
  rawQuery: string
}

// ── Lookup tables ──────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, { key: string; slug: string }> = {
  elektronik: { key: "elektronik", slug: "electronics" },
  electronic: { key: "elektronik", slug: "electronics" },
  teknoloji:  { key: "elektronik", slug: "electronics" },
  tech:       { key: "elektronik", slug: "electronics" },
  moda:       { key: "moda",       slug: "fashion" },
  fashion:    { key: "moda",       slug: "fashion" },
  kıyafet:   { key: "moda",       slug: "fashion" },
  giyim:     { key: "moda",       slug: "fashion" },
  güzellik:  { key: "guzellik",   slug: "beauty" },
  guzellik:  { key: "guzellik",   slug: "beauty" },
  kozmetik:  { key: "guzellik",   slug: "beauty" },
  beauty:    { key: "guzellik",   slug: "beauty" },
  spor:      { key: "spor",       slug: "sports" },
  sport:     { key: "spor",       slug: "sports" },
  fitness:   { key: "spor",       slug: "sports" },
  ev:        { key: "ev-bahce",   slug: "home-garden" },
  home:      { key: "ev-bahce",   slug: "home-garden" },
  mobilya:   { key: "ev-bahce",   slug: "home-garden" },
  çocuk:    { key: "cocuk",      slug: "kids-baby" },
  bebek:     { key: "cocuk",      slug: "kids-baby" },
  kids:      { key: "cocuk",      slug: "kids-baby" },
  market:    { key: "market",     slug: "groceries" },
  gıda:     { key: "market",     slug: "groceries" },
  sağlık:   { key: "saglik",     slug: "health" },
  saglik:    { key: "saglik",     slug: "health" },
  kitap:     { key: "kitap",      slug: "books" },
  book:      { key: "kitap",      slug: "books" },
  takı:     { key: "taki",       slug: "jewelry" },
  taki:      { key: "taki",       slug: "jewelry" },
}

const SUBCATEGORY_MAP: Record<string, { tag: string; catKey: string; slug: string }> = {
  // Electronics
  telefon:           { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  phone:             { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  "cep telefonu":    { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  "akıllı telefon":  { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  smartphone:        { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  laptop:            { tag: "laptop",        catKey: "elektronik", slug: "computers" },
  bilgisayar:        { tag: "laptop",        catKey: "elektronik", slug: "computers" },
  "dizüstü":        { tag: "laptop",        catKey: "elektronik", slug: "computers" },
  tablet:            { tag: "tablet",        catKey: "elektronik", slug: "tablets" },
  ipad:              { tag: "tablet",        catKey: "elektronik", slug: "tablets" },
  kulaklık:         { tag: "kulaklık",      catKey: "elektronik", slug: "audio" },
  kulakliklар:       { tag: "kulaklık",      catKey: "elektronik", slug: "audio" },
  earbuds:           { tag: "kulaklık",      catKey: "elektronik", slug: "audio" },
  airpods:           { tag: "kulaklık",      catKey: "elektronik", slug: "audio" },
  saat:              { tag: "smartwatch",    catKey: "elektronik", slug: "watches" },
  watch:             { tag: "smartwatch",    catKey: "elektronik", slug: "watches" },
  kamera:            { tag: "kamera",        catKey: "elektronik", slug: "cameras" },
  camera:            { tag: "kamera",        catKey: "elektronik", slug: "cameras" },
  oyun:              { tag: "oyun",          catKey: "elektronik", slug: "gaming" },
  gaming:            { tag: "oyun",          catKey: "elektronik", slug: "gaming" },
  // Fashion
  elbise:            { tag: "elbise",        catKey: "moda", slug: "womens" },
  dress:             { tag: "elbise",        catKey: "moda", slug: "womens" },
  ayakkabı:         { tag: "ayakkabi",      catKey: "moda", slug: "shoes" },
  sneaker:           { tag: "ayakkabi",      catKey: "moda", slug: "shoes" },
  bot:               { tag: "ayakkabi",      catKey: "moda", slug: "shoes" },
  çanta:            { tag: "canta",         catKey: "moda", slug: "bags" },
  bag:               { tag: "canta",         catKey: "moda", slug: "bags" },
  // Beauty
  "cilt bakımı":    { tag: "cilt-bakimi",   catKey: "guzellik", slug: "skincare" },
  serum:             { tag: "cilt-bakimi",   catKey: "guzellik", slug: "skincare" },
  makyaj:            { tag: "makyaj",        catKey: "guzellik", slug: "makeup" },
  parfüm:           { tag: "parfum",        catKey: "guzellik", slug: "fragrance" },
  parfum:            { tag: "parfum",        catKey: "guzellik", slug: "fragrance" },
  // Sports
  koşu:             { tag: "kosu",          catKey: "spor", slug: "running" },
  running:           { tag: "kosu",          catKey: "spor", slug: "running" },
  outdoor:           { tag: "outdoor",       catKey: "spor", slug: "outdoor" },
}

const BRAND_MAP: Record<string, string> = {
  samsung: "samsung", apple: "apple", iphone: "apple", ipad: "apple",
  macbook: "apple", xiaomi: "xiaomi", huawei: "huawei", oppo: "oppo",
  nokia: "nokia", sony: "sony", lg: "lg",
  nike: "nike", adidas: "adidas", puma: "puma", reebok: "reebok",
  zara: "zara", mango: "mango", lcw: "lc-waikiki", bershka: "bershka",
  clinique: "clinique", loreal: "loreal", dyson: "dyson",
  philips: "philips", bosch: "bosch",
}

const ATTRIBUTE_MAP: Record<string, string> = {
  "5g": "5g", wifi: "wifi", bluetooth: "bluetooth",
  "su geçirmez": "su-gecirmez", "su gecirmez": "su-gecirmez",
  organik: "organik", vegan: "vegan",
  android: "android", ios: "ios",
  orijinal: "orijinal", ithal: "ithal", yerli: "yerli",
}

// ── Parser ─────────────────────────────────────────────────────────────────

export function parseSearchIntent(query: string): SearchIntent {
  const lower = query.toLowerCase().trim()
  const tokens = lower.split(/\s+/)

  const intent: SearchIntent = { attributes: [], rawQuery: query }

  // 1. Check multi-word subcategory patterns first (longest match wins)
  const sortedSubKeys = Object.keys(SUBCATEGORY_MAP).sort((a, b) => b.length - a.length)
  for (const pattern of sortedSubKeys) {
    if (lower.includes(pattern)) {
      const sub = SUBCATEGORY_MAP[pattern]
      intent.subcategory = sub.tag
      intent.subcategorySlug = sub.slug
      if (!intent.category) {
        intent.category = sub.catKey
        intent.categorySlug = CATEGORY_MAP[sub.catKey]?.slug
      }
      break
    }
  }

  // 2. Multi-word attribute patterns
  for (const [pattern, attr] of Object.entries(ATTRIBUTE_MAP)) {
    if (lower.includes(pattern) && !intent.attributes.includes(attr)) {
      intent.attributes.push(attr)
    }
  }

  // 3. Single-token analysis
  for (const token of tokens) {
    if (!intent.category && CATEGORY_MAP[token]) {
      intent.category = CATEGORY_MAP[token].key
      intent.categorySlug = CATEGORY_MAP[token].slug
    }
    if (!intent.subcategory && SUBCATEGORY_MAP[token]) {
      const sub = SUBCATEGORY_MAP[token]
      intent.subcategory = sub.tag
      intent.subcategorySlug = sub.slug
    }
    if (!intent.brand && BRAND_MAP[token]) {
      intent.brand = BRAND_MAP[token]
    }
    if (ATTRIBUTE_MAP[token] && !intent.attributes.includes(ATTRIBUTE_MAP[token])) {
      intent.attributes.push(ATTRIBUTE_MAP[token])
    }
  }

  return intent
}

// ── Autocomplete suggestions ───────────────────────────────────────────────

export interface SearchSuggestion {
  type: "category" | "subcategory" | "brand" | "query"
  label: string
  href: string
  tag?: string
}

export function getSearchSuggestions(query: string): SearchSuggestion[] {
  if (!query || query.length < 1) return []
  const lower = query.toLowerCase().trim()
  const suggestions: SearchSuggestion[] = []

  // Category matches
  for (const [token, cat] of Object.entries(CATEGORY_MAP)) {
    if (token.includes(lower) && suggestions.length < 3) {
      if (!suggestions.find(s => s.href === `/products?category=${cat.slug}`)) {
        suggestions.push({
          type: "category",
          label: `${cat.key.charAt(0).toUpperCase()}${cat.key.slice(1).replace("-", " ")}`,
          href: `/products?category=${cat.slug}`,
          tag: cat.key,
        })
      }
    }
  }

  // Brand matches
  for (const [token, brand] of Object.entries(BRAND_MAP)) {
    if (token.includes(lower) && suggestions.length < 6) {
      if (!suggestions.find(s => s.tag === brand)) {
        suggestions.push({
          type: "brand",
          label: `${brand.charAt(0).toUpperCase()}${brand.slice(1)} (marka)`,
          href: `/products?q=${encodeURIComponent(brand)}`,
          tag: brand,
        })
      }
    }
  }

  // Subcategory matches
  for (const [token, sub] of Object.entries(SUBCATEGORY_MAP)) {
    if (token.includes(lower) && suggestions.length < 8) {
      if (!suggestions.find(s => s.tag === sub.tag)) {
        suggestions.push({
          type: "subcategory",
          label: `${sub.tag.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
          href: `/products?category=${sub.catKey}&sub=${sub.slug}`,
          tag: sub.tag,
        })
      }
    }
  }

  // Always add raw query suggestion first
  suggestions.unshift({
    type: "query",
    label: `"${query}" ile ara`,
    href: `/products?q=${encodeURIComponent(query)}`,
  })

  return suggestions.slice(0, 7)
}
