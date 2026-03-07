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
    name: "Electronics",
    slug: "electronics",
    description: "Phones, laptops, accessories and more",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
    icon: "Smartphone",
    productCount: 45
  },
  {
    id: "fashion",
    name: "Fashion",
    slug: "fashion",
    description: "Clothing, shoes and apparel for everyone",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
    icon: "Shirt",
    productCount: 62
  },
  {
    id: "home-garden",
    name: "Home & Garden",
    slug: "home-garden",
    description: "Furniture, decor and garden essentials",
    image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=300&fit=crop",
    icon: "Home",
    productCount: 38
  },
  {
    id: "beauty",
    name: "Beauty & Personal Care",
    slug: "beauty",
    description: "Skincare, makeup and fragrances",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
    icon: "Sparkles",
    productCount: 54
  },
  {
    id: "sports",
    name: "Sports & Outdoors",
    slug: "sports",
    description: "Fitness gear, camping and sports equipment",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop",
    icon: "Dumbbell",
    productCount: 41
  },
  {
    id: "kids-baby",
    name: "Kids & Baby",
    slug: "kids-baby",
    description: "Toys, clothing and baby essentials",
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop",
    icon: "Baby",
    productCount: 33
  },
  {
    id: "jewelry",
    name: "Jewelry & Accessories",
    slug: "jewelry",
    description: "Watches, bags and fine jewelry",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop",
    icon: "Watch",
    productCount: 29
  },
  {
    id: "groceries",
    name: "Groceries & Food",
    slug: "groceries",
    description: "Pantry staples, beverages and fresh produce",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    icon: "ShoppingBasket",
    productCount: 67
  },
  {
    id: "health",
    name: "Health & Wellness",
    slug: "health",
    description: "Vitamins, supplements and medical supplies",
    image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=300&fit=crop",
    icon: "Heart",
    productCount: 36
  },
  {
    id: "books",
    name: "Books & Stationery",
    slug: "books",
    description: "Books, office supplies and art materials",
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
