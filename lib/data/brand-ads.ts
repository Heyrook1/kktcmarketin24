export interface BrandAd {
  id: string
  brandName: string
  logo: string
  tagline: string
  discount?: string
  backgroundColor: string
  textColor: string
  link: string
  featured: boolean
  priority: number
}

export const brandAds: BrandAd[] = [
  {
    id: "ad-001",
    brandName: "TechZone KKTC",
    logo: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=80&h=80&fit=crop",
    tagline: "En yeni teknoloji ürünleri",
    discount: "%30 İNDİRİM",
    backgroundColor: "bg-gradient-to-r from-blue-600 to-cyan-500",
    textColor: "text-white",
    link: "/vendor/techzone",
    featured: true,
    priority: 1
  },
  {
    id: "ad-002",
    brandName: "Kıbrıs Moda",
    logo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop",
    tagline: "Yaz koleksiyonu geldi",
    discount: "YENİ SEZON",
    backgroundColor: "bg-gradient-to-r from-pink-500 to-rose-500",
    textColor: "text-white",
    link: "/vendor/modastyle",
    featured: true,
    priority: 2
  },
  {
    id: "ad-003",
    brandName: "Güzellik Evi",
    logo: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=80&h=80&fit=crop",
    tagline: "Doğal güzellik sırları",
    discount: "%20 İNDİRİM",
    backgroundColor: "bg-gradient-to-r from-purple-500 to-pink-500",
    textColor: "text-white",
    link: "/vendor/glowbeauty",
    featured: true,
    priority: 3
  },
  {
    id: "ad-004",
    brandName: "Spor Merkezi",
    logo: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=80&h=80&fit=crop",
    tagline: "Fitness ekipmanları",
    discount: "ÜCRETSİZ KARGO",
    backgroundColor: "bg-gradient-to-r from-green-500 to-emerald-500",
    textColor: "text-white",
    link: "/vendor/sportmax",
    featured: true,
    priority: 4
  },
  {
    id: "ad-005",
    brandName: "Ev Sanat",
    logo: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop",
    tagline: "Evinizi yenileyin",
    discount: "%15 İNDİRİM",
    backgroundColor: "bg-gradient-to-r from-amber-500 to-orange-500",
    textColor: "text-white",
    link: "/vendor/homenest",
    featured: true,
    priority: 5
  },
  {
    id: "ad-006",
    brandName: "Taze Market",
    logo: "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=80&h=80&fit=crop",
    tagline: "Günlük taze ürünler",
    discount: "GÜNÜN FIRSATI",
    backgroundColor: "bg-gradient-to-r from-lime-500 to-green-500",
    textColor: "text-white",
    link: "/vendor/freshmart",
    featured: true,
    priority: 6
  },
  {
    id: "ad-007",
    brandName: "Çocuk Dünyası",
    logo: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=80&h=80&fit=crop",
    tagline: "Mutlu çocuklar için",
    discount: "2 AL 1 ÖDE",
    backgroundColor: "bg-gradient-to-r from-sky-400 to-blue-500",
    textColor: "text-white",
    link: "/vendor/kidworld",
    featured: true,
    priority: 7
  },
  {
    id: "ad-008",
    brandName: "Lüks Aksesuar",
    logo: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=80&h=80&fit=crop",
    tagline: "Zarafet ve şıklık",
    discount: "ÖZEL TASARIM",
    backgroundColor: "bg-gradient-to-r from-slate-700 to-slate-900",
    textColor: "text-white",
    link: "/vendor/luxeaccessories",
    featured: true,
    priority: 8
  }
]

export function getFeaturedAds(): BrandAd[] {
  return brandAds
    .filter(ad => ad.featured)
    .sort((a, b) => a.priority - b.priority)
}
