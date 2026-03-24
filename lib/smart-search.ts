// lib/smart-search.ts
// Parses a free-form Turkish/English/Greek search query into structured filter intent.
// Supports TR (Turkish), EN (English) and CY (Greek/Ελληνικά) keywords.
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
  // ── TR
  elektronik: { key: "elektronik", slug: "electronics" },
  teknoloji:  { key: "elektronik", slug: "electronics" },
  moda:       { key: "moda",       slug: "fashion" },
  kıyafet:    { key: "moda",       slug: "fashion" },
  giyim:      { key: "moda",       slug: "fashion" },
  güzellik:   { key: "guzellik",   slug: "beauty" },
  guzellik:   { key: "guzellik",   slug: "beauty" },
  kozmetik:   { key: "guzellik",   slug: "beauty" },
  spor:       { key: "spor",       slug: "sports" },
  fitness:    { key: "spor",       slug: "sports" },
  ev:         { key: "ev-bahce",   slug: "home-garden" },
  mobilya:    { key: "ev-bahce",   slug: "home-garden" },
  çocuk:      { key: "cocuk",      slug: "kids-baby" },
  bebek:      { key: "cocuk",      slug: "kids-baby" },
  market:     { key: "market",     slug: "groceries" },
  gıda:       { key: "market",     slug: "groceries" },
  sağlık:     { key: "saglik",     slug: "health" },
  saglik:     { key: "saglik",     slug: "health" },
  kitap:      { key: "kitap",      slug: "books" },
  takı:       { key: "taki",       slug: "jewelry" },
  taki:       { key: "taki",       slug: "jewelry" },
  // ── EN
  electronic: { key: "elektronik", slug: "electronics" },
  tech:       { key: "elektronik", slug: "electronics" },
  technology: { key: "elektronik", slug: "electronics" },
  fashion:    { key: "moda",       slug: "fashion" },
  clothing:   { key: "moda",       slug: "fashion" },
  apparel:    { key: "moda",       slug: "fashion" },
  beauty:     { key: "guzellik",   slug: "beauty" },
  cosmetics:  { key: "guzellik",   slug: "beauty" },
  sport:      { key: "spor",       slug: "sports" },
  sports:     { key: "spor",       slug: "sports" },
  home:       { key: "ev-bahce",   slug: "home-garden" },
  garden:     { key: "ev-bahce",   slug: "home-garden" },
  furniture:  { key: "ev-bahce",   slug: "home-garden" },
  kids:       { key: "cocuk",      slug: "kids-baby" },
  baby:       { key: "cocuk",      slug: "kids-baby" },
  food:       { key: "market",     slug: "groceries" },
  grocery:    { key: "market",     slug: "groceries" },
  health:     { key: "saglik",     slug: "health" },
  wellness:   { key: "saglik",     slug: "health" },
  book:       { key: "kitap",      slug: "books" },
  books:      { key: "kitap",      slug: "books" },
  jewelry:    { key: "taki",       slug: "jewelry" },
  jewellery:  { key: "taki",       slug: "jewelry" },
  // ── CY (Greek / Ελληνικά)
  ηλεκτρονικά:  { key: "elektronik", slug: "electronics" },
  τεχνολογία:   { key: "elektronik", slug: "electronics" },
  μόδα:         { key: "moda",       slug: "fashion" },
  ρούχα:        { key: "moda",       slug: "fashion" },
  ενδύματα:     { key: "moda",       slug: "fashion" },
  ομορφιά:      { key: "guzellik",   slug: "beauty" },
  καλλυντικά:   { key: "guzellik",   slug: "beauty" },
  αθλητισμός:   { key: "spor",       slug: "sports" },
  αθλητικά:     { key: "spor",       slug: "sports" },
  σπίτι:        { key: "ev-bahce",   slug: "home-garden" },
  σπορ:         { key: "spor",       slug: "sports" },
  σπίτι:        { key: "ev-bahce",   slug: "home-garden" },
  κήπος:        { key: "ev-bahce",   slug: "home-garden" },
  παιδιά:       { key: "cocuk",      slug: "kids-baby" },
  βρέφος:       { key: "cocuk",      slug: "kids-baby" },
  τρόφιμα:      { key: "market",     slug: "groceries" },
  αγορά:        { key: "market",     slug: "groceries" },
  υγεία:        { key: "saglik",     slug: "health" },
  βιβλίο:       { key: "kitap",      slug: "books" },
  βιβλία:       { key: "kitap",      slug: "books" },
  κοσμήματα:    { key: "taki",       slug: "jewelry" },
}

const SUBCATEGORY_MAP: Record<string, { tag: string; catKey: string; slug: string }> = {
  // ── Electronics TR
  telefon:             { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  "cep telefonu":      { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  "akıllı telefon":    { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  laptop:              { tag: "laptop",        catKey: "elektronik", slug: "computers" },
  bilgisayar:          { tag: "laptop",        catKey: "elektronik", slug: "computers" },
  "dizüstü":           { tag: "laptop",        catKey: "elektronik", slug: "computers" },
  tablet:              { tag: "tablet",        catKey: "elektronik", slug: "tablets" },
  ipad:                { tag: "tablet",        catKey: "elektronik", slug: "tablets" },
  kulaklık:            { tag: "kulaklık",      catKey: "elektronik", slug: "audio" },
  saat:                { tag: "smartwatch",    catKey: "elektronik", slug: "watches" },
  kamera:              { tag: "kamera",        catKey: "elektronik", slug: "cameras" },
  oyun:                { tag: "oyun",          catKey: "elektronik", slug: "gaming" },
  // ── Electronics EN
  phone:               { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  smartphone:          { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  computer:            { tag: "laptop",        catKey: "elektronik", slug: "computers" },
  notebook:            { tag: "laptop",        catKey: "elektronik", slug: "computers" },
  earbuds:             { tag: "kulaklık",      catKey: "elektronik", slug: "audio" },
  headphones:          { tag: "kulaklık",      catKey: "elektronik", slug: "audio" },
  airpods:             { tag: "kulaklık",      catKey: "elektronik", slug: "audio" },
  watch:               { tag: "smartwatch",    catKey: "elektronik", slug: "watches" },
  camera:              { tag: "kamera",        catKey: "elektronik", slug: "cameras" },
  gaming:              { tag: "oyun",          catKey: "elektronik", slug: "gaming" },
  // ── Electronics CY (Greek)
  τηλέφωνο:            { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  "κινητό τηλέφωνο":   { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  κινητό:              { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  "έξυπνο τηλέφωνο":  { tag: "cep-telefonu",  catKey: "elektronik", slug: "phones" },
  φορητός:             { tag: "laptop",        catKey: "elektronik", slug: "computers" },
  "φορητός υπολογιστής":{ tag: "laptop",       catKey: "elektronik", slug: "computers" },
  ακουστικά:           { tag: "kulaklık",      catKey: "elektronik", slug: "audio" },
  ρολόι:               { tag: "smartwatch",    catKey: "elektronik", slug: "watches" },
  φωτογραφική:         { tag: "kamera",        catKey: "elektronik", slug: "cameras" },
  παιχνίδια:           { tag: "oyun",          catKey: "elektronik", slug: "gaming" },
  // ── Fashion TR
  elbise:              { tag: "elbise",        catKey: "moda", slug: "womens" },
  ayakkabı:            { tag: "ayakkabi",      catKey: "moda", slug: "shoes" },
  "ayakkabi":          { tag: "ayakkabi",      catKey: "moda", slug: "shoes" },
  sneaker:             { tag: "ayakkabi",      catKey: "moda", slug: "shoes" },
  bot:                 { tag: "ayakkabi",      catKey: "moda", slug: "shoes" },
  çanta:               { tag: "canta",         catKey: "moda", slug: "bags" },
  canta:               { tag: "canta",         catKey: "moda", slug: "bags" },
  // ── Fashion EN
  dress:               { tag: "elbise",        catKey: "moda", slug: "womens" },
  shoes:               { tag: "ayakkabi",      catKey: "moda", slug: "shoes" },
  boots:               { tag: "ayakkabi",      catKey: "moda", slug: "shoes" },
  bag:                 { tag: "canta",         catKey: "moda", slug: "bags" },
  handbag:             { tag: "canta",         catKey: "moda", slug: "bags" },
  // ── Fashion CY (Greek)
  φόρεμα:              { tag: "elbise",        catKey: "moda", slug: "womens" },
  παπούτσια:           { tag: "ayakkabi",      catKey: "moda", slug: "shoes" },
  παπούτσι:            { tag: "ayakkabi",      catKey: "moda", slug: "shoes" },
  τσάντα:              { tag: "canta",         catKey: "moda", slug: "bags" },
  // ── Beauty TR
  "cilt bakımı":       { tag: "cilt-bakimi",   catKey: "guzellik", slug: "skincare" },
  serum:               { tag: "cilt-bakimi",   catKey: "guzellik", slug: "skincare" },
  makyaj:              { tag: "makyaj",        catKey: "guzellik", slug: "makeup" },
  parfüm:              { tag: "parfum",        catKey: "guzellik", slug: "fragrance" },
  parfum:              { tag: "parfum",        catKey: "guzellik", slug: "fragrance" },
  // ── Beauty EN
  skincare:            { tag: "cilt-bakimi",   catKey: "guzellik", slug: "skincare" },
  makeup:              { tag: "makyaj",        catKey: "guzellik", slug: "makeup" },
  perfume:             { tag: "parfum",        catKey: "guzellik", slug: "fragrance" },
  fragrance:           { tag: "parfum",        catKey: "guzellik", slug: "fragrance" },
  // ── Beauty CY (Greek)
  "περιποίηση δέρματος": { tag: "cilt-bakimi", catKey: "guzellik", slug: "skincare" },
  μακιγιάζ:            { tag: "makyaj",        catKey: "guzellik", slug: "makeup" },
  άρωμα:               { tag: "parfum",        catKey: "guzellik", slug: "fragrance" },
  // ── Sports TR
  koşu:                { tag: "kosu",          catKey: "spor", slug: "running" },
  outdoor:             { tag: "outdoor",       catKey: "spor", slug: "outdoor" },
  // ── Sports EN
  running:             { tag: "kosu",          catKey: "spor", slug: "running" },
  // ── Sports CY (Greek)
  τρέξιμο:             { tag: "kosu",          catKey: "spor", slug: "running" },
  // ── Home TR
  mutfak:              { tag: "mutfak",        catKey: "ev-bahce", slug: "kitchen" },
  dekorasyon:          { tag: "dekorasyon",    catKey: "ev-bahce", slug: "decor" },
  // ── Home EN
  kitchen:             { tag: "mutfak",        catKey: "ev-bahce", slug: "kitchen" },
  decor:               { tag: "dekorasyon",    catKey: "ev-bahce", slug: "decor" },
  decoration:          { tag: "dekorasyon",    catKey: "ev-bahce", slug: "decor" },
  // ── Home CY (Greek)
  κουζίνα:             { tag: "mutfak",        catKey: "ev-bahce", slug: "kitchen" },
  διακόσμηση:          { tag: "dekorasyon",    catKey: "ev-bahce", slug: "decor" },
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
  waterproof: "su-gecirmez",
  organik: "organik", organic: "organik",
  vegan: "vegan",
  android: "android", ios: "ios",
  orijinal: "orijinal", original: "orijinal",
  ithal: "ithal", imported: "ithal",
  yerli: "yerli", local: "yerli",
  // CY (Greek) attributes
  ανθεκτικό: "su-gecirmez",   // waterproof
  οργανικό: "organik",        // organic
  αυθεντικό: "orijinal",      // original/authentic
}

// ── Parser ─────────────────────────────────────────────────────────────────

export function parseSearchIntent(query: string): SearchIntent {
  const lower = query.toLowerCase().trim()
  const tokens = lower.split(/\s+/)
  const intent: SearchIntent = { attributes: [], rawQuery: query }

  // 1. Multi-word subcategory patterns (longest match wins)
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

// ── Multilingual aliases builder ────────────────────────────────────────────
// Generates a flat string of TR + EN + CY terms for a given category/tag set.
// Store this in the `search_aliases` DB column so Supabase full-text search
// can match queries in any of the three supported languages.

const ALIAS_MAP: Record<string, string[]> = {
  // Categories
  "electronics":  ["elektronik", "teknoloji", "electronic", "technology", "ηλεκτρονικά", "τεχνολογία"],
  "fashion":      ["moda", "giyim", "kıyafet", "fashion", "clothing", "μόδα", "ρούχα", "ενδύματα"],
  "beauty":       ["güzellik", "kozmetik", "beauty", "cosmetics", "ομορφιά", "καλλυντικά"],
  "sports":       ["spor", "fitness", "sport", "athletics", "αθλητισμός", "αθλητικά"],
  "home-garden":  ["ev", "bahçe", "mobilya", "home", "garden", "furniture", "σπίτι", "κήπος"],
  "kids-baby":    ["çocuk", "bebek", "kids", "baby", "children", "παιδιά", "βρέφος"],
  "groceries":    ["market", "gıda", "yiyecek", "food", "grocery", "τρόφιμα", "αγορά"],
  "health":       ["sağlık", "wellness", "health", "υγεία"],
  "books":        ["kitap", "book", "books", "βιβλίο", "βιβλία"],
  "jewelry":      ["takı", "mücevher", "jewelry", "jewellery", "κοσμήματα"],
  // Subcategories
  "phones":       ["telefon", "cep telefonu", "akıllı telefon", "phone", "smartphone", "τηλέφωνο", "κινητό"],
  "computers":    ["laptop", "bilgisayar", "dizüstü", "computer", "notebook", "φορητός υπολογιστής"],
  "tablets":      ["tablet", "ipad", "tablet", "τάμπλετ"],
  "audio":        ["kulaklık", "hoparlör", "headphones", "earbuds", "speaker", "ακουστικά"],
  "watches":      ["saat", "akıllı saat", "watch", "smartwatch", "ρολόι"],
  "cameras":      ["kamera", "fotoğraf makinesi", "camera", "φωτογραφική"],
  "gaming":       ["oyun", "oyuncu", "gaming", "video games", "παιχνίδια"],
  "shoes":        ["ayakkabı", "sneaker", "bot", "shoes", "boots", "sneakers", "παπούτσια"],
  "bags":         ["çanta", "bag", "handbag", "backpack", "τσάντα"],
  "skincare":     ["cilt bakımı", "serum", "moisturizer", "skincare", "περιποίηση δέρματος"],
  "makeup":       ["makyaj", "makeup", "cosmetics", "μακιγιάζ"],
  "fragrance":    ["parfüm", "koku", "perfume", "fragrance", "άρωμα"],
  "running":      ["koşu", "koşu ayakkabısı", "running", "τρέξιμο"],
  "kitchen":      ["mutfak", "kitchen", "cooking", "κουζίνα"],
  "decor":        ["dekorasyon", "decoration", "decor", "διακόσμηση"],
}

export function buildSearchAliases(
  categorySlug: string,
  subcategories: string[],
  extraTerms: string[] = []
): string {
  const terms = new Set<string>()
  const addAlias = (key: string) => {
    const aliases = ALIAS_MAP[key] ?? []
    aliases.forEach((a) => terms.add(a.toLowerCase()))
  }
  addAlias(categorySlug)
  subcategories.forEach(addAlias)
  extraTerms.forEach((t) => terms.add(t.toLowerCase()))
  return Array.from(terms).join(" ")
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
