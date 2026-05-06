// lib/tag-taxonomy.ts
// Tag taxonomy for the smart search and filter system.
// Used in: search parser, product card chips, vendor tag editor, filter sidebar.

export interface TagMeta {
  label: string
  color: "blue" | "purple" | "gray" | "green" | "orange"
}

export interface SubcategoryMeta extends TagMeta {
  slug: string
}

export interface CategoryMeta extends TagMeta {
  slug: string
  subcategories: Record<string, SubcategoryMeta>
}

export const TAG_TAXONOMY: Record<string, CategoryMeta> = {
  elektronik: {
    label: "Elektronik",
    slug: "electronics",
    color: "blue",
    subcategories: {
      "cep-telefonu":  { label: "Cep Telefonu",  slug: "phones",     color: "blue" },
      "laptop":        { label: "Laptop",         slug: "computers",  color: "blue" },
      "tablet":        { label: "Tablet",         slug: "tablets",    color: "blue" },
      "kulaklık":      { label: "Kulaklık",       slug: "audio",      color: "blue" },
      "smartwatch":    { label: "Akıllı Saat",    slug: "watches",    color: "blue" },
      "tv":            { label: "Televizyon",     slug: "electronics",color: "blue" },
      "kamera":        { label: "Kamera",         slug: "cameras",    color: "blue" },
      "oyun":          { label: "Oyun",           slug: "gaming",     color: "blue" },
      "aksesuar":      { label: "Aksesuar",       slug: "accessories",color: "blue" },
    },
  },
  moda: {
    label: "Moda",
    slug: "fashion",
    color: "purple",
    subcategories: {
      "elbise":        { label: "Elbise",        slug: "womens",      color: "purple" },
      "ayakkabi":      { label: "Ayakkabı",      slug: "shoes",       color: "purple" },
      "canta":         { label: "Çanta",         slug: "bags",        color: "purple" },
      "erkek-giyim":   { label: "Erkek Giyim",  slug: "mens",        color: "purple" },
      "kadin-giyim":   { label: "Kadın Giyim",  slug: "womens",      color: "purple" },
      "cocuk-giyim":   { label: "Çocuk Giyim",  slug: "kids-fashion",color: "purple" },
      "dis-giyim":     { label: "Dış Giyim",    slug: "outerwear",   color: "purple" },
    },
  },
  guzellik: {
    label: "Güzellik",
    slug: "beauty",
    color: "orange",
    subcategories: {
      "cilt-bakimi":   { label: "Cilt Bakımı",  slug: "skincare",    color: "orange" },
      "makyaj":        { label: "Makyaj",        slug: "makeup",      color: "orange" },
      "parfum":        { label: "Parfüm",        slug: "fragrance",   color: "orange" },
      "sac-bakimi":    { label: "Saç Bakımı",   slug: "haircare",    color: "orange" },
      "erkek-bakimi":  { label: "Erkek Bakımı", slug: "mens-grooming",color: "orange" },
    },
  },
  spor: {
    label: "Spor",
    slug: "sports",
    color: "green",
    subcategories: {
      "fitness":       { label: "Fitness",      slug: "fitness",     color: "green" },
      "kosu":          { label: "Koşu",         slug: "running",     color: "green" },
      "outdoor":       { label: "Outdoor",      slug: "outdoor",     color: "green" },
      "takim-sporlari":{ label: "Takım Sporları",slug: "team-sports", color: "green" },
      "yuzme":         { label: "Yüzme",        slug: "swimming",    color: "green" },
    },
  },
  "ev-bahce": {
    label: "Ev & Bahçe",
    slug: "home-garden",
    color: "gray",
    subcategories: {
      "mobilya":       { label: "Mobilya",      slug: "furniture",   color: "gray" },
      "dekorasyon":    { label: "Dekorasyon",   slug: "decor",       color: "gray" },
      "mutfak":        { label: "Mutfak",       slug: "kitchen",     color: "gray" },
      "yatak-banyo":   { label: "Yatak & Banyo",slug: "bedding",     color: "gray" },
      "bahce":         { label: "Bahçe",        slug: "garden",      color: "gray" },
      "aydinlatma":    { label: "Aydınlatma",   slug: "lighting",    color: "gray" },
    },
  },
  cocuk: {
    label: "Çocuk & Bebek",
    slug: "kids-baby",
    color: "blue",
    subcategories: {
      "oyuncak":       { label: "Oyuncak",      slug: "toys",        color: "blue" },
      "bebek-giyim":   { label: "Bebek Giyim",  slug: "baby-clothes",color: "blue" },
      "bebek-arabasi": { label: "Bebek Arabası",slug: "strollers",   color: "blue" },
      "egitim":        { label: "Eğitim",       slug: "education",   color: "blue" },
    },
  },
  market: {
    label: "Market & Gıda",
    slug: "groceries",
    color: "green",
    subcategories: {
      "taze":          { label: "Taze Ürünler", slug: "fresh",       color: "green" },
      "icecek":        { label: "İçecekler",    slug: "beverages",   color: "green" },
      "atistirmalik":  { label: "Atıştırmalık", slug: "snacks",      color: "green" },
      "sut-urunleri":  { label: "Süt Ürünleri",slug: "dairy",       color: "green" },
      "organik":       { label: "Organik",      slug: "organic",     color: "green" },
    },
  },
  saglik: {
    label: "Sağlık & Wellness",
    slug: "health",
    color: "green",
    subcategories: {
      "vitamin":       { label: "Vitaminler",   slug: "vitamins",    color: "green" },
      "takviye":       { label: "Takviyeler",   slug: "supplements", color: "green" },
      "medikal":       { label: "Medikal",      slug: "medical",     color: "green" },
    },
  },
  kitap: {
    label: "Kitap & Kırtasiye",
    slug: "books",
    color: "gray",
    subcategories: {
      "roman":         { label: "Roman",        slug: "novels",      color: "gray" },
      "egitim-kitap":  { label: "Eğitim",       slug: "educational", color: "gray" },
      "kirtasiye":     { label: "Kırtasiye",    slug: "stationery",  color: "gray" },
      "sanat":         { label: "Sanat",        slug: "art-supplies",color: "gray" },
    },
  },
  taki: {
    label: "Takı & Aksesuar",
    slug: "jewelry",
    color: "purple",
    subcategories: {
      "saat":          { label: "Saatler",      slug: "watches",     color: "purple" },
      "kolye":         { label: "Kolyeler",     slug: "necklaces",   color: "purple" },
      "yuzuk":         { label: "Yüzükler",     slug: "rings",       color: "purple" },
      "bileklik":      { label: "Bileklikler",  slug: "bracelets",   color: "purple" },
    },
  },
}

// Well-known brand tags — color is always "purple"
export const BRAND_TAGS: Record<string, string> = {
  samsung: "Samsung", apple: "Apple", xiaomi: "Xiaomi", huawei: "Huawei",
  oppo: "Oppo", nokia: "Nokia", sony: "Sony", lg: "LG",
  nike: "Nike", adidas: "Adidas", puma: "Puma", reebok: "Reebok",
  zara: "Zara", mango: "Mango", "lc-waikiki": "LC Waikiki", bershka: "Bershka",
  clinique: "Clinique", "mac-cosmetics": "MAC", loreal: "L'Oréal",
  philips: "Philips", bosch: "Bosch", dyson: "Dyson",
}

// Attribute tags — color is always "gray"
export const ATTRIBUTE_TAGS: Record<string, string> = {
  "5g": "5G", wifi: "WiFi", bluetooth: "Bluetooth",
  "su-gecirmez": "Su Geçirmez", "toz-gecirmez": "Toz Geçirmez",
  organik: "Organik", vegan: "Vegan", "el-yapimi": "El Yapımı",
  ithal: "İthal", yerli: "Yerli", orijinal: "Orijinal",
  android: "Android", ios: "iOS", windows: "Windows",
  flagship: "Flagship", "yeni-sezon": "Yeni Sezon",
}

export const FILTER_PREFIXES = ["gender", "size", "color", "brand", "type", "subtype"] as const
export type FilterPrefix = typeof FILTER_PREFIXES[number]

export const TR_COLOR_HEX: Record<string, string> = {
  siyah:       "#1a1a1a",
  beyaz:       "#ffffff",
  kırmızı:     "#ef4444",
  kirmizi:     "#ef4444",
  mavi:        "#3b82f6",
  "açık mavi": "#7dd3fc",
  lacivert:    "#1e3a5f",
  yeşil:       "#22c55e",
  yesil:       "#22c55e",
  gri:         "#6b7280",
  sarı:        "#eab308",
  sari:        "#eab308",
  turuncu:     "#f97316",
  mor:         "#a855f7",
  pembe:       "#ec4899",
  kahverengi:  "#92400e",
  bej:         "#d4a574",
  krem:        "#fef3c7",
  haki:        "#737523",
  bordo:       "#9f1239",
  altın:       "#d97706",
  altin:       "#d97706",
  gümüş:       "#9ca3af",
  gumus:       "#9ca3af",
}

// Get display label + color for any tag
export function getTagMeta(tag: string): { label: string; color: "blue" | "purple" | "gray" | "green" | "orange" } {
  // Handle prefixed filter tags: "gender:erkek" → { label: "Erkek", color: "blue" }
  const colonIdx = tag.indexOf(":")
  if (colonIdx !== -1) {
    const prefix = tag.slice(0, colonIdx) as FilterPrefix
    if ((FILTER_PREFIXES as readonly string[]).includes(prefix)) {
      const value = tag.slice(colonIdx + 1)
      const label = value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      const colorMap: Record<FilterPrefix, "blue" | "purple" | "gray" | "green" | "orange"> = {
        gender: "blue", size: "gray", color: "orange",
        brand: "purple", type: "green", subtype: "green",
      }
      return { label, color: colorMap[prefix] }
    }
  }

  // Check category
  if (TAG_TAXONOMY[tag]) {
    return { label: TAG_TAXONOMY[tag].label, color: TAG_TAXONOMY[tag].color }
  }
  // Check subcategories
  for (const cat of Object.values(TAG_TAXONOMY)) {
    if (cat.subcategories[tag]) {
      return { label: cat.subcategories[tag].label, color: cat.subcategories[tag].color }
    }
  }
  // Check brand
  if (BRAND_TAGS[tag]) return { label: BRAND_TAGS[tag], color: "purple" }
  // Check attribute
  if (ATTRIBUTE_TAGS[tag]) return { label: ATTRIBUTE_TAGS[tag], color: "gray" }
  // Fallback: capitalise the tag
  return { label: tag.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()), color: "gray" }
}

// Given a category slug (from categories.ts), return the taxonomy key
export function categorySlugToTaxonomyKey(slug: string): string | undefined {
  for (const [key, meta] of Object.entries(TAG_TAXONOMY)) {
    if (meta.slug === slug) return key
  }
  return undefined
}

// Suggested tags for a given category key
export function getSuggestedTagsForCategory(categoryKey: string): string[] {
  const cat = TAG_TAXONOMY[categoryKey]
  if (!cat) return []
  return [categoryKey, ...Object.keys(cat.subcategories).slice(0, 4)]
}
