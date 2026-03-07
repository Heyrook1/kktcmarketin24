export interface Category {
  id: string
  name: string
  slug: string
  description: string
  image: string
  icon: string
  productCount: number
}

export const categories: Category[] = [
  {
    id: "electronics",
    name: "Elektronik",
    slug: "electronics",
    description: "Telefon, bilgisayar, aksesuar ve daha fazlası",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
    icon: "Smartphone",
    productCount: 45
  },
  {
    id: "fashion",
    name: "Moda",
    slug: "fashion",
    description: "Giyim, ayakkabı ve herkes için kıyafetler",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
    icon: "Shirt",
    productCount: 62
  },
  {
    id: "home-garden",
    name: "Ev & Bahçe",
    slug: "home-garden",
    description: "Mobilya, dekorasyon ve bahçe ürünleri",
    image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=300&fit=crop",
    icon: "Home",
    productCount: 38
  },
  {
    id: "beauty",
    name: "Güzellik & Kişisel Bakım",
    slug: "beauty",
    description: "Cilt bakımı, makyaj ve parfümler",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
    icon: "Sparkles",
    productCount: 54
  },
  {
    id: "sports",
    name: "Spor & Outdoor",
    slug: "sports",
    description: "Fitness ekipmanları, kamp ve spor malzemeleri",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop",
    icon: "Dumbbell",
    productCount: 41
  },
  {
    id: "kids-baby",
    name: "Çocuk & Bebek",
    slug: "kids-baby",
    description: "Oyuncaklar, kıyafetler ve bebek ürünleri",
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop",
    icon: "Baby",
    productCount: 33
  },
  {
    id: "jewelry",
    name: "Takı & Aksesuar",
    slug: "jewelry",
    description: "Saat, çanta ve değerli takılar",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop",
    icon: "Watch",
    productCount: 29
  },
  {
    id: "groceries",
    name: "Market & Gıda",
    slug: "groceries",
    description: "Temel gıdalar, içecekler ve taze ürünler",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    icon: "ShoppingBasket",
    productCount: 67
  },
  {
    id: "health",
    name: "Sağlık & Wellness",
    slug: "health",
    description: "Vitaminler, takviyeler ve medikal ürünler",
    image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=300&fit=crop",
    icon: "Heart",
    productCount: 36
  },
  {
    id: "books",
    name: "Kitap & Kırtasiye",
    slug: "books",
    description: "Kitaplar, ofis malzemeleri ve sanat ürünleri",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
    icon: "BookOpen",
    productCount: 48
  }
]

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(cat => cat.slug === slug)
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find(cat => cat.id === id)
}
