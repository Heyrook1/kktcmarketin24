export interface Subcategory {
  id: string
  name: string
  slug: string
  href: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  image: string
  icon: string
  // productCount is NOT stored here — always compute with:
  //   products.filter(p => p.categoryId === category.id).length
  subcategories?: Subcategory[]
  featured?: { label: string; image: string; href: string }
}

export const categories: Category[] = [
  {
    id: "electronics",
    name: "Elektronik",
    slug: "electronics",
    description: "Telefon, bilgisayar, aksesuar ve daha fazlası",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
    icon: "Smartphone",
    subcategories: [
      { id: "phones", name: "Cep Telefonları", slug: "phones", href: "/category/electronics?sub=phones" },
      { id: "computers", name: "Bilgisayarlar", slug: "computers", href: "/category/electronics?sub=computers" },
      { id: "tablets", name: "Tabletler", slug: "tablets", href: "/category/electronics?sub=tablets" },
      { id: "audio", name: "Ses Sistemleri", slug: "audio", href: "/category/electronics?sub=audio" },
      { id: "cameras", name: "Kameralar", slug: "cameras", href: "/category/electronics?sub=cameras" },
      { id: "accessories", name: "Aksesuarlar", slug: "accessories", href: "/category/electronics?sub=accessories" },
      { id: "gaming", name: "Oyun Konsolları", slug: "gaming", href: "/category/electronics?sub=gaming" },
      { id: "smart-home", name: "Akıllı Ev", slug: "smart-home", href: "/category/electronics?sub=smart-home" },
    ],
    featured: { label: "Yeni Sezon Kulaklıklar", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&h=140&fit=crop", href: "/category/electronics?sub=audio" }
  },
  {
    id: "fashion",
    name: "Moda",
    slug: "fashion",
    description: "Giyim, ayakkabı ve herkes için kıyafetler",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
    icon: "Shirt",
    subcategories: [
      { id: "mens", name: "Erkek Giyim", slug: "mens", href: "/category/fashion?sub=mens" },
      { id: "womens", name: "Kadın Giyim", slug: "womens", href: "/category/fashion?sub=womens" },
      { id: "kids-fashion", name: "Çocuk Giyim", slug: "kids-fashion", href: "/category/fashion?sub=kids-fashion" },
      { id: "shoes", name: "Ayakkabılar", slug: "shoes", href: "/category/fashion?sub=shoes" },
      { id: "bags", name: "Çantalar", slug: "bags", href: "/category/fashion?sub=bags" },
      { id: "outerwear", name: "Dış Giyim", slug: "outerwear", href: "/category/fashion?sub=outerwear" },
    ],
    featured: { label: "Deri Ceket Koleksiyonu", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=140&fit=crop", href: "/category/fashion?sub=outerwear" }
  },
  {
    id: "home-garden",
    name: "Ev & Bahçe",
    slug: "home-garden",
    description: "Mobilya, dekorasyon ve bahçe ürünleri",
    image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=300&fit=crop",
    icon: "Home",
    subcategories: [
      { id: "furniture", name: "Mobilya", slug: "furniture", href: "/category/home-garden?sub=furniture" },
      { id: "decor", name: "Dekorasyon", slug: "decor", href: "/category/home-garden?sub=decor" },
      { id: "kitchen", name: "Mutfak", slug: "kitchen", href: "/category/home-garden?sub=kitchen" },
      { id: "bedding", name: "Yatak & Banyo", slug: "bedding", href: "/category/home-garden?sub=bedding" },
      { id: "garden", name: "Bahçe", slug: "garden", href: "/category/home-garden?sub=garden" },
      { id: "lighting", name: "Aydınlatma", slug: "lighting", href: "/category/home-garden?sub=lighting" },
    ],
    featured: { label: "Yaz Bahçe Koleksiyonu", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=140&fit=crop", href: "/category/home-garden?sub=garden" }
  },
  {
    id: "beauty",
    name: "Güzellik",
    slug: "beauty",
    description: "Cilt bakımı, makyaj ve parfümler",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
    icon: "Sparkles",
    subcategories: [
      { id: "skincare", name: "Cilt Bakımı", slug: "skincare", href: "/category/beauty?sub=skincare" },
      { id: "makeup", name: "Makyaj", slug: "makeup", href: "/category/beauty?sub=makeup" },
      { id: "fragrance", name: "Parfüm", slug: "fragrance", href: "/category/beauty?sub=fragrance" },
      { id: "haircare", name: "Saç Bakımı", slug: "haircare", href: "/category/beauty?sub=haircare" },
      { id: "mens-grooming", name: "Erkek Bakımı", slug: "mens-grooming", href: "/category/beauty?sub=mens-grooming" },
    ],
    featured: { label: "Premium Cilt Serumu", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=200&h=140&fit=crop", href: "/category/beauty?sub=skincare" }
  },
  {
    id: "sports",
    name: "Spor & Outdoor",
    slug: "sports",
    description: "Fitness ekipmanları, kamp ve spor malzemeleri",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop",
    icon: "Dumbbell",
    subcategories: [
      { id: "fitness", name: "Fitness", slug: "fitness", href: "/category/sports?sub=fitness" },
      { id: "running", name: "Koşu", slug: "running", href: "/category/sports?sub=running" },
      { id: "outdoor", name: "Outdoor", slug: "outdoor", href: "/category/sports?sub=outdoor" },
      { id: "team-sports", name: "Takım Sporları", slug: "team-sports", href: "/category/sports?sub=team-sports" },
      { id: "swimming", name: "Yüzme", slug: "swimming", href: "/category/sports?sub=swimming" },
    ],
    featured: { label: "Koşu Ayakkabıları", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=140&fit=crop", href: "/category/sports?sub=running" }
  },
  {
    id: "kids-baby",
    name: "Çocuk & Bebek",
    slug: "kids-baby",
    description: "Oyuncaklar, kıyafetler ve bebek ürünleri",
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop",
    icon: "Baby",
    subcategories: [
      { id: "toys", name: "Oyuncaklar", slug: "toys", href: "/category/kids-baby?sub=toys" },
      { id: "baby-clothes", name: "Bebek Giyim", slug: "baby-clothes", href: "/category/kids-baby?sub=baby-clothes" },
      { id: "strollers", name: "Bebek Arabası", slug: "strollers", href: "/category/kids-baby?sub=strollers" },
      { id: "education", name: "Eğitim", slug: "education", href: "/category/kids-baby?sub=education" },
    ]
  },
  {
    id: "jewelry",
    name: "Takı & Aksesuar",
    slug: "jewelry",
    description: "Saat, çanta ve değerli takılar",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop",
    icon: "Watch",
    subcategories: [
      { id: "watches", name: "Saatler", slug: "watches", href: "/category/jewelry?sub=watches" },
      { id: "necklaces", name: "Kolyeler", slug: "necklaces", href: "/category/jewelry?sub=necklaces" },
      { id: "rings", name: "Yüzükler", slug: "rings", href: "/category/jewelry?sub=rings" },
      { id: "bracelets", name: "Bileklikler", slug: "bracelets", href: "/category/jewelry?sub=bracelets" },
    ]
  },
  {
    id: "groceries",
    name: "Market & Gıda",
    slug: "groceries",
    description: "Temel gıdalar, içecekler ve taze ürünler",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    icon: "ShoppingBasket",
    subcategories: [
      { id: "fresh", name: "Taze Ürünler", slug: "fresh", href: "/category/groceries?sub=fresh" },
      { id: "beverages", name: "İçecekler", slug: "beverages", href: "/category/groceries?sub=beverages" },
      { id: "snacks", name: "Atıştırmalık", slug: "snacks", href: "/category/groceries?sub=snacks" },
      { id: "dairy", name: "Süt Ürünleri", slug: "dairy", href: "/category/groceries?sub=dairy" },
      { id: "organic", name: "Organik", slug: "organic", href: "/category/groceries?sub=organic" },
    ]
  },
  {
    id: "health",
    name: "Sağlık & Wellness",
    slug: "health",
    description: "Vitaminler, takviyeler ve medikal ürünler",
    image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=300&fit=crop",
    icon: "Heart",
    subcategories: [
      { id: "vitamins", name: "Vitaminler", slug: "vitamins", href: "/category/health?sub=vitamins" },
      { id: "supplements", name: "Takviyeler", slug: "supplements", href: "/category/health?sub=supplements" },
      { id: "medical", name: "Medikal", slug: "medical", href: "/category/health?sub=medical" },
    ]
  },
  {
    id: "books",
    name: "Kitap & Kırtasiye",
    slug: "books",
    description: "Kitaplar, ofis malzemeleri ve sanat ürünleri",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
    icon: "BookOpen",
    subcategories: [
      { id: "novels", name: "Romanlar", slug: "novels", href: "/category/books?sub=novels" },
      { id: "educational", name: "Eğitim", slug: "educational", href: "/category/books?sub=educational" },
      { id: "stationery", name: "Kırtasiye", slug: "stationery", href: "/category/books?sub=stationery" },
      { id: "art-supplies", name: "Sanat Malzemeleri", slug: "art-supplies", href: "/category/books?sub=art-supplies" },
    ]
  }
]

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(cat => cat.slug === slug)
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find(cat => cat.id === id)
}
