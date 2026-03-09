export interface ProductSize {
  size: string
  stock: number
  available: boolean
}

export interface ProductColor {
  name: string
  hex: string
  stock: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  categoryId: string
  vendorId: string
  rating: number
  reviewCount: number
  inStock: boolean
  stockCount: number
  tags: string[]
  featured: boolean
  createdAt: string
  // New dynamic properties
  sizes?: ProductSize[]
  colors?: ProductColor[]
  specifications?: Record<string, string>
  material?: string
  weight?: string
  dimensions?: string
  warranty?: string
  lastUpdated?: string
}

export const products: Product[] = [
  // TechZone - Electronics
  {
    id: "tz-001",
    name: "Wireless Bluetooth Earbuds Pro",
    slug: "wireless-bluetooth-earbuds-pro",
    description: "Premium wireless earbuds with active noise cancellation, 30-hour battery life, and crystal-clear sound quality. IPX5 water resistant.",
    price: 1299,
    originalPrice: 1599,
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop",
    ],
    inStock: true,
    stockCount: 150,
    tags: ["wireless", "bluetooth", "earbuds", "noise-cancelling"],
    featured: true,
    createdAt: "2024-01-15",
    colors: [
      { name: "Siyah", hex: "#1a1a1a", stock: 80 },
      { name: "Beyaz", hex: "#ffffff", stock: 45 },
      { name: "Mavi", hex: "#3b82f6", stock: 25 }
    ],
    specifications: {
      "Batarya Ömrü": "30 saat",
      "Bluetooth": "5.2",
      "Su Geçirmezlik": "IPX5",
      "Şarj Süresi": "2 saat"
    },
    warranty: "2 yıl",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "tz-002",
    name: "Smart Watch Series X",
    slug: "smart-watch-series-x",
    description: "Advanced smartwatch with health monitoring, GPS, and 7-day battery life. Beautiful AMOLED display.",
    price: 2499,
    originalPrice: 2999,
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop"],
    categoryId: "electronics",
    vendorId: "techzone",
    rating: 4.7,
    reviewCount: 256,
    inStock: true,
    stockCount: 80,
    tags: ["smartwatch", "fitness", "health"],
    featured: true,
    createdAt: "2024-01-10"
  },
  {
    id: "tz-003",
    name: "Portable Power Bank 20000mAh",
    slug: "portable-power-bank-20000",
    description: "Fast charging power bank with 20000mAh capacity. Charges 3 devices simultaneously.",
    price: 549,
    images: ["https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop"],
    categoryId: "electronics",
    vendorId: "techzone",
    rating: 4.6,
    reviewCount: 189,
    inStock: true,
    stockCount: 200,
    tags: ["power-bank", "charging", "portable"],
    featured: false,
    createdAt: "2024-02-01"
  },
  {
    id: "tz-004",
    name: "Mechanical Gaming Keyboard RGB",
    slug: "mechanical-gaming-keyboard-rgb",
    description: "Professional gaming keyboard with RGB backlighting, hot-swappable switches, and programmable keys.",
    price: 899,
    originalPrice: 1099,
    images: ["https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&h=600&fit=crop"],
    categoryId: "electronics",
    vendorId: "techzone",
    rating: 4.9,
    reviewCount: 412,
    inStock: true,
    stockCount: 65,
    tags: ["keyboard", "gaming", "rgb", "mechanical"],
    featured: true,
    createdAt: "2024-01-20"
  },
  {
    id: "tz-005",
    name: "Wireless Charging Pad",
    slug: "wireless-charging-pad",
    description: "Fast wireless charger compatible with all Qi-enabled devices. Sleek minimalist design.",
    price: 299,
    images: ["https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=600&h=600&fit=crop"],
    categoryId: "electronics",
    vendorId: "techzone",
    rating: 4.5,
    reviewCount: 156,
    inStock: true,
    stockCount: 300,
    tags: ["charger", "wireless", "qi"],
    featured: false,
    createdAt: "2024-02-05"
  },

  // ModaStyle - Fashion
  {
    id: "ms-001",
    name: "Classic Leather Jacket",
    slug: "classic-leather-jacket",
    description: "Timeless genuine leather jacket with premium stitching. Perfect for any occasion.",
    price: 3499,
    originalPrice: 4299,
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=600&fit=crop",
    ],
    inStock: true,
    stockCount: 25,
    tags: ["leather", "jacket", "classic", "premium"],
    featured: true,
    createdAt: "2024-01-12",
    sizes: [
      { size: "S", stock: 3, available: true },
      { size: "M", stock: 8, available: true },
      { size: "L", stock: 10, available: true },
      { size: "XL", stock: 4, available: true },
      { size: "XXL", stock: 0, available: false }
    ],
    colors: [
      { name: "Siyah", hex: "#1a1a1a", stock: 15 },
      { name: "Kahverengi", hex: "#8B4513", stock: 10 }
    ],
    material: "100% Hakiki Deri",
    specifications: {
      "Kumaş": "Hakiki Deri",
      "Astar": "Polyester",
      "Fermuar": "YKK Metal"
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: "ms-002",
    name: "Premium Cotton T-Shirt",
    slug: "premium-cotton-tshirt",
    description: "Ultra-soft 100% organic cotton t-shirt. Breathable and comfortable for everyday wear.",
    price: 299,
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop"],
    categoryId: "fashion",
    vendorId: "modastyle",
    rating: 4.6,
    reviewCount: 534,
    inStock: true,
    stockCount: 500,
    tags: ["cotton", "t-shirt", "casual"],
    featured: false,
    createdAt: "2024-02-01",
    sizes: [
      { size: "XS", stock: 50, available: true },
      { size: "S", stock: 120, available: true },
      { size: "M", stock: 180, available: true },
      { size: "L", stock: 100, available: true },
      { size: "XL", stock: 40, available: true },
      { size: "XXL", stock: 10, available: true }
    ],
    colors: [
      { name: "Beyaz", hex: "#ffffff", stock: 200 },
      { name: "Siyah", hex: "#1a1a1a", stock: 150 },
      { name: "Gri", hex: "#6b7280", stock: 100 },
      { name: "Lacivert", hex: "#1e3a5f", stock: 50 }
    ],
    material: "100% Organik Pamuk"
  },
  {
    id: "ms-003",
    name: "Slim Fit Denim Jeans",
    slug: "slim-fit-denim-jeans",
    description: "Modern slim fit jeans with stretch comfort. Durable construction with classic styling.",
    price: 899,
    originalPrice: 1099,
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=600&fit=crop"],
    categoryId: "fashion",
    vendorId: "modastyle",
    rating: 4.7,
    reviewCount: 423,
    inStock: true,
    stockCount: 180,
    tags: ["jeans", "denim", "slim-fit"],
    featured: true,
    createdAt: "2024-01-25"
  },
  {
    id: "ms-004",
    name: "Elegant Silk Scarf",
    slug: "elegant-silk-scarf",
    description: "Luxurious 100% silk scarf with beautiful printed patterns. Perfect accessory for any outfit.",
    price: 699,
    images: ["https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&h=600&fit=crop"],
    categoryId: "fashion",
    vendorId: "modastyle",
    rating: 4.9,
    reviewCount: 178,
    inStock: true,
    stockCount: 60,
    tags: ["silk", "scarf", "accessory", "elegant"],
    featured: false,
    createdAt: "2024-02-10"
  },
  {
    id: "ms-005",
    name: "Running Sneakers Ultra",
    slug: "running-sneakers-ultra",
    description: "Lightweight running shoes with responsive cushioning and breathable mesh upper.",
    price: 1499,
    sizes: [
      { size: "38", stock: 5, available: true },
      { size: "39", stock: 12, available: true },
      { size: "40", stock: 18, available: true },
      { size: "41", stock: 22, available: true },
      { size: "42", stock: 20, available: true },
      { size: "43", stock: 15, available: true },
      { size: "44", stock: 8, available: true },
      { size: "45", stock: 3, available: true },
      { size: "46", stock: 0, available: false }
    ],
    colors: [
      { name: "Siyah/Beyaz", hex: "#1a1a1a", stock: 50 },
      { name: "Mavi/Gri", hex: "#3b82f6", stock: 30 },
      { name: "Kırmızı/Siyah", hex: "#ef4444", stock: 23 }
    ],
    originalPrice: 1799,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&h=600&fit=crop",
    ],
    inStock: true,
    stockCount: 120,
    tags: ["sneakers", "running", "sports"],
    featured: true,
    createdAt: "2024-01-18"
  },

  // HomeNest - Home & Garden
  {
    id: "hn-001",
    name: "Modern Minimalist Lamp",
    slug: "modern-minimalist-lamp",
    description: "Sleek desk lamp with adjustable brightness and color temperature. USB charging port included.",
    price: 799,
    originalPrice: 999,
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop"],
    categoryId: "home-garden",
    vendorId: "homenest",
    rating: 4.7,
    reviewCount: 234,
    inStock: true,
    stockCount: 90,
    tags: ["lamp", "lighting", "modern", "minimalist"],
    featured: true,
    createdAt: "2024-01-22"
  },
  {
    id: "hn-002",
    name: "Ceramic Plant Pot Set",
    slug: "ceramic-plant-pot-set",
    description: "Set of 3 elegant ceramic pots in different sizes. Perfect for indoor plants and succulents.",
    price: 449,
    images: ["https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&h=600&fit=crop"],
    categoryId: "home-garden",
    vendorId: "homenest",
    rating: 4.8,
    reviewCount: 312,
    inStock: true,
    stockCount: 75,
    tags: ["pot", "ceramic", "plants", "decor"],
    featured: true,
    createdAt: "2024-01-28"
  },
  {
    id: "hn-003",
    name: "Luxury Throw Blanket",
    slug: "luxury-throw-blanket",
    description: "Super soft microfiber throw blanket. Perfect for cozy evenings on the couch.",
    price: 599,
    images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop"],
    categoryId: "home-garden",
    vendorId: "homenest",
    rating: 4.9,
    reviewCount: 456,
    inStock: true,
    stockCount: 200,
    tags: ["blanket", "throw", "cozy", "soft"],
    featured: false,
    createdAt: "2024-02-05"
  },
  {
    id: "hn-004",
    name: "Wall Art Canvas Print",
    slug: "wall-art-canvas-print",
    description: "Beautiful abstract wall art on premium canvas. Ready to hang with included hardware.",
    price: 899,
    originalPrice: 1199,
    images: ["https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&h=600&fit=crop"],
    categoryId: "home-garden",
    vendorId: "homenest",
    rating: 4.6,
    reviewCount: 178,
    inStock: true,
    stockCount: 45,
    tags: ["art", "canvas", "wall-decor", "abstract"],
    featured: false,
    createdAt: "2024-02-08"
  },
  {
    id: "hn-005",
    name: "Smart Garden Irrigation System",
    slug: "smart-garden-irrigation",
    description: "Automated watering system with app control. Perfect for gardens and balcony plants.",
    price: 1299,
    images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=600&fit=crop"],
    categoryId: "home-garden",
    vendorId: "homenest",
    rating: 4.5,
    reviewCount: 89,
    inStock: true,
    stockCount: 30,
    tags: ["garden", "irrigation", "smart", "automated"],
    featured: true,
    createdAt: "2024-01-30"
  },

  // GlowBeauty - Beauty
  {
    id: "gb-001",
    name: "Vitamin C Serum 30ml",
    slug: "vitamin-c-serum",
    description: "Brightening vitamin C serum with hyaluronic acid. Reduces dark spots and improves skin texture.",
    price: 599,
    originalPrice: 749,
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=600&fit=crop",
    ],
    inStock: true,
    stockCount: 250,
    tags: ["serum", "vitamin-c", "skincare", "brightening"],
    featured: true,
    createdAt: "2024-01-08"
  },
  {
    id: "gb-002",
    name: "Hydrating Face Moisturizer",
    slug: "hydrating-face-moisturizer",
    description: "Lightweight daily moisturizer with ceramides and niacinamide. For all skin types.",
    price: 449,
    images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop"],
    categoryId: "beauty",
    vendorId: "glowbeauty",
    rating: 4.8,
    reviewCount: 534,
    inStock: true,
    stockCount: 300,
    tags: ["moisturizer", "hydrating", "skincare", "daily"],
    featured: true,
    createdAt: "2024-01-15"
  },
  {
    id: "gb-003",
    name: "Luxury Perfume 50ml",
    slug: "luxury-perfume-50ml",
    description: "Elegant fragrance with notes of jasmine, vanilla, and sandalwood. Long-lasting scent.",
    price: 1899,
    originalPrice: 2299,
    images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop"],
    categoryId: "beauty",
    vendorId: "glowbeauty",
    rating: 4.7,
    reviewCount: 245,
    inStock: true,
    stockCount: 80,
    tags: ["perfume", "fragrance", "luxury"],
    featured: true,
    createdAt: "2024-01-20"
  },
  {
    id: "gb-004",
    name: "Makeup Brush Set Professional",
    slug: "makeup-brush-set-professional",
    description: "12-piece professional makeup brush set with premium synthetic bristles and elegant case.",
    price: 799,
    images: ["https://images.unsplash.com/photo-1522338242042-2d1c917f7f8e?w=600&h=600&fit=crop"],
    categoryId: "beauty",
    vendorId: "glowbeauty",
    rating: 4.8,
    reviewCount: 312,
    inStock: true,
    stockCount: 120,
    tags: ["makeup", "brushes", "professional", "set"],
    featured: false,
    createdAt: "2024-02-01"
  },
  {
    id: "gb-005",
    name: "Natural Lip Balm Set",
    slug: "natural-lip-balm-set",
    description: "Set of 4 organic lip balms with natural ingredients. Moisturizes and protects lips.",
    price: 199,
    images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&h=600&fit=crop"],
    categoryId: "beauty",
    vendorId: "glowbeauty",
    rating: 4.6,
    reviewCount: 423,
    inStock: true,
    stockCount: 400,
    tags: ["lip-balm", "natural", "organic", "set"],
    featured: false,
    createdAt: "2024-02-08"
  },

  // SportMax - Sports
  {
    id: "sm-001",
    name: "Yoga Mat Premium",
    slug: "yoga-mat-premium",
    description: "Extra thick eco-friendly yoga mat with non-slip surface. Perfect for yoga, pilates, and meditation.",
    price: 699,
    originalPrice: 899,
    images: ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop"],
    categoryId: "sports",
    vendorId: "sportmax",
    rating: 4.8,
    reviewCount: 389,
    inStock: true,
    stockCount: 150,
    tags: ["yoga", "mat", "fitness", "eco-friendly"],
    featured: true,
    createdAt: "2024-01-10"
  },
  {
    id: "sm-002",
    name: "Adjustable Dumbbell Set",
    slug: "adjustable-dumbbell-set",
    description: "Space-saving adjustable dumbbells from 2.5kg to 25kg. Quick weight change mechanism.",
    price: 2999,
    originalPrice: 3499,
    images: ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop"],
    categoryId: "sports",
    vendorId: "sportmax",
    rating: 4.9,
    reviewCount: 267,
    inStock: true,
    stockCount: 40,
    tags: ["dumbbell", "weights", "fitness", "gym"],
    featured: true,
    createdAt: "2024-01-15"
  },
  {
    id: "sm-003",
    name: "Resistance Bands Set",
    slug: "resistance-bands-set",
    description: "Complete set of 5 resistance bands with different strengths. Includes door anchor and handles.",
    price: 349,
    images: ["https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&h=600&fit=crop"],
    categoryId: "sports",
    vendorId: "sportmax",
    rating: 4.7,
    reviewCount: 456,
    inStock: true,
    stockCount: 280,
    tags: ["resistance-bands", "workout", "fitness"],
    featured: false,
    createdAt: "2024-01-25"
  },
  {
    id: "sm-004",
    name: "Camping Tent 4-Person",
    slug: "camping-tent-4-person",
    description: "Waterproof 4-person tent with easy setup. Perfect for family camping adventures.",
    price: 1899,
    images: ["https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=600&h=600&fit=crop"],
    categoryId: "sports",
    vendorId: "sportmax",
    rating: 4.6,
    reviewCount: 178,
    inStock: true,
    stockCount: 35,
    tags: ["tent", "camping", "outdoor", "waterproof"],
    featured: true,
    createdAt: "2024-02-01"
  },
  {
    id: "sm-005",
    name: "Sports Water Bottle 1L",
    slug: "sports-water-bottle-1l",
    description: "Insulated stainless steel water bottle. Keeps drinks cold for 24hrs or hot for 12hrs.",
    price: 299,
    images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop"],
    categoryId: "sports",
    vendorId: "sportmax",
    rating: 4.5,
    reviewCount: 534,
    inStock: true,
    stockCount: 450,
    tags: ["bottle", "water", "sports", "insulated"],
    featured: false,
    createdAt: "2024-02-05"
  },

  // KidWorld - Kids & Baby
  {
    id: "kw-001",
    name: "Educational Building Blocks",
    slug: "educational-building-blocks",
    description: "100-piece colorful building blocks set. Develops creativity and motor skills.",
    price: 449,
    originalPrice: 549,
    images: ["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&h=600&fit=crop"],
    categoryId: "kids-baby",
    vendorId: "kidworld",
    rating: 4.9,
    reviewCount: 345,
    inStock: true,
    stockCount: 200,
    tags: ["toys", "educational", "blocks", "kids"],
    featured: true,
    createdAt: "2024-01-12"
  },
  {
    id: "kw-002",
    name: "Soft Baby Blanket",
    slug: "soft-baby-blanket",
    description: "Ultra-soft organic cotton baby blanket. Gentle on sensitive skin.",
    price: 349,
    images: ["https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&h=600&fit=crop"],
    categoryId: "kids-baby",
    vendorId: "kidworld",
    rating: 4.8,
    reviewCount: 267,
    inStock: true,
    stockCount: 180,
    tags: ["baby", "blanket", "organic", "soft"],
    featured: true,
    createdAt: "2024-01-18"
  },
  {
    id: "kw-003",
    name: "Kids Backpack Dinosaur",
    slug: "kids-backpack-dinosaur",
    description: "Fun dinosaur-themed backpack for kids. Comfortable straps and spacious compartments.",
    price: 299,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop"],
    categoryId: "kids-baby",
    vendorId: "kidworld",
    rating: 4.7,
    reviewCount: 189,
    inStock: true,
    stockCount: 120,
    tags: ["backpack", "kids", "school", "dinosaur"],
    featured: false,
    createdAt: "2024-01-28"
  },
  {
    id: "kw-004",
    name: "Wooden Puzzle Set",
    slug: "wooden-puzzle-set",
    description: "Set of 4 wooden puzzles with animal themes. Safe non-toxic paint.",
    price: 399,
    images: ["https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=600&h=600&fit=crop"],
    categoryId: "kids-baby",
    vendorId: "kidworld",
    rating: 4.8,
    reviewCount: 234,
    inStock: true,
    stockCount: 150,
    tags: ["puzzle", "wooden", "toys", "educational"],
    featured: true,
    createdAt: "2024-02-02"
  },
  {
    id: "kw-005",
    name: "Baby Feeding Set",
    slug: "baby-feeding-set",
    description: "Complete BPA-free feeding set with plate, bowl, cup, and utensils.",
    price: 249,
    images: ["https://images.unsplash.com/photo-1584839404042-8bc21d240de0?w=600&h=600&fit=crop"],
    categoryId: "kids-baby",
    vendorId: "kidworld",
    rating: 4.6,
    reviewCount: 178,
    inStock: true,
    stockCount: 200,
    tags: ["baby", "feeding", "bpa-free", "set"],
    featured: false,
    createdAt: "2024-02-08"
  },

  // LuxeAccessories - Jewelry
  {
    id: "la-001",
    name: "Classic Leather Watch",
    slug: "classic-leather-watch",
    description: "Elegant men's watch with genuine leather strap and stainless steel case.",
    price: 2499,
    originalPrice: 2999,
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=600&fit=crop"],
    categoryId: "jewelry",
    vendorId: "luxeaccessories",
    rating: 4.8,
    reviewCount: 234,
    inStock: true,
    stockCount: 45,
    tags: ["watch", "leather", "classic", "men"],
    featured: true,
    createdAt: "2024-01-10"
  },
  {
    id: "la-002",
    name: "Pearl Necklace Set",
    slug: "pearl-necklace-set",
    description: "Elegant freshwater pearl necklace with matching earrings. Perfect gift for special occasions.",
    price: 1899,
    images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop"],
    categoryId: "jewelry",
    vendorId: "luxeaccessories",
    rating: 4.9,
    reviewCount: 156,
    inStock: true,
    stockCount: 30,
    tags: ["pearl", "necklace", "jewelry", "elegant"],
    featured: true,
    createdAt: "2024-01-15"
  },
  {
    id: "la-003",
    name: "Leather Messenger Bag",
    slug: "leather-messenger-bag",
    description: "Handcrafted genuine leather messenger bag. Spacious with multiple compartments.",
    price: 1699,
    originalPrice: 1999,
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop"],
    categoryId: "jewelry",
    vendorId: "luxeaccessories",
    rating: 4.7,
    reviewCount: 189,
    inStock: true,
    stockCount: 55,
    tags: ["bag", "leather", "messenger", "handcrafted"],
    featured: true,
    createdAt: "2024-01-22"
  },
  {
    id: "la-004",
    name: "Gold Bracelet Chain",
    slug: "gold-bracelet-chain",
    description: "18K gold-plated chain bracelet. Elegant minimalist design for everyday wear.",
    price: 899,
    images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop"],
    categoryId: "jewelry",
    vendorId: "luxeaccessories",
    rating: 4.6,
    reviewCount: 145,
    inStock: true,
    stockCount: 80,
    tags: ["bracelet", "gold", "jewelry", "minimalist"],
    featured: false,
    createdAt: "2024-02-01"
  },
  {
    id: "la-005",
    name: "Designer Sunglasses",
    slug: "designer-sunglasses",
    description: "Premium polarized sunglasses with UV400 protection. Classic aviator style.",
    price: 1299,
    images: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop"],
    categoryId: "jewelry",
    vendorId: "luxeaccessories",
    rating: 4.8,
    reviewCount: 267,
    inStock: true,
    stockCount: 70,
    tags: ["sunglasses", "polarized", "uv-protection", "aviator"],
    featured: false,
    createdAt: "2024-02-05"
  },

  // FreshMart - Groceries & Health
  {
    id: "fm-001",
    name: "Organic Olive Oil 500ml",
    slug: "organic-olive-oil-500ml",
    description: "Cold-pressed extra virgin olive oil from organic farms. Rich flavor for cooking and salads.",
    price: 249,
    images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=600&fit=crop"],
    categoryId: "groceries",
    vendorId: "freshmart",
    rating: 4.9,
    reviewCount: 456,
    inStock: true,
    stockCount: 300,
    tags: ["olive-oil", "organic", "cooking", "extra-virgin"],
    featured: true,
    createdAt: "2024-01-08"
  },
  {
    id: "fm-002",
    name: "Premium Turkish Coffee",
    slug: "premium-turkish-coffee",
    description: "Finely ground Turkish coffee beans. Traditional roasting for authentic flavor.",
    price: 149,
    images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=600&fit=crop"],
    categoryId: "groceries",
    vendorId: "freshmart",
    rating: 4.8,
    reviewCount: 678,
    inStock: true,
    stockCount: 500,
    tags: ["coffee", "turkish", "premium", "traditional"],
    featured: true,
    createdAt: "2024-01-12"
  },
  {
    id: "fm-003",
    name: "Organic Honey 500g",
    slug: "organic-honey-500g",
    description: "Pure organic honey from local beekeepers. Raw and unfiltered.",
    price: 299,
    images: ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=600&fit=crop"],
    categoryId: "groceries",
    vendorId: "freshmart",
    rating: 4.9,
    reviewCount: 389,
    inStock: true,
    stockCount: 200,
    tags: ["honey", "organic", "raw", "natural"],
    featured: true,
    createdAt: "2024-01-18"
  },
  {
    id: "fm-004",
    name: "Multivitamin Complex",
    slug: "multivitamin-complex",
    description: "Complete daily multivitamin with essential nutrients. 60 tablets.",
    price: 399,
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop"],
    categoryId: "health",
    vendorId: "freshmart",
    rating: 4.7,
    reviewCount: 234,
    inStock: true,
    stockCount: 250,
    tags: ["vitamins", "supplements", "health", "daily"],
    featured: false,
    createdAt: "2024-01-25"
  },
  {
    id: "fm-005",
    name: "Herbal Tea Collection",
    slug: "herbal-tea-collection",
    description: "Assortment of 6 premium herbal teas. Relaxing and caffeine-free.",
    price: 199,
    images: ["https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600&h=600&fit=crop"],
    categoryId: "groceries",
    vendorId: "freshmart",
    rating: 4.6,
    reviewCount: 312,
    inStock: true,
    stockCount: 350,
    tags: ["tea", "herbal", "caffeine-free", "relaxing"],
    featured: false,
    createdAt: "2024-02-01"
  },
  {
    id: "fm-006",
    name: "Protein Powder Vanilla",
    slug: "protein-powder-vanilla",
    description: "High-quality whey protein powder with vanilla flavor. 1kg pack.",
    price: 899,
    originalPrice: 1099,
    images: ["https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&h=600&fit=crop"],
    categoryId: "health",
    vendorId: "freshmart",
    rating: 4.8,
    reviewCount: 287,
    inStock: true,
    stockCount: 120,
    tags: ["protein", "supplement", "fitness", "vanilla"],
    featured: true,
    createdAt: "2024-02-05"
  },

  // Additional products for books category (using FreshMart as we need more vendors)
  {
    id: "bk-001",
    name: "Premium Notebook Set",
    slug: "premium-notebook-set",
    description: "Set of 3 hardcover notebooks with premium paper. Perfect for journaling or note-taking.",
    price: 299,
    images: ["https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&h=600&fit=crop"],
    categoryId: "books",
    vendorId: "homenest",
    rating: 4.7,
    reviewCount: 189,
    inStock: true,
    stockCount: 250,
    tags: ["notebook", "stationery", "journal", "premium"],
    featured: true,
    createdAt: "2024-01-20"
  },
  {
    id: "bk-002",
    name: "Art Supplies Kit",
    slug: "art-supplies-kit",
    description: "Complete art kit with colored pencils, markers, and sketchbook. Great for beginners.",
    price: 499,
    images: ["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=600&fit=crop"],
    categoryId: "books",
    vendorId: "homenest",
    rating: 4.8,
    reviewCount: 156,
    inStock: true,
    stockCount: 100,
    tags: ["art", "supplies", "drawing", "kit"],
    featured: true,
    createdAt: "2024-02-01"
  }
]

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id)
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug)
}

export function getProductsByCategory(categoryId: string): Product[] {
  return products.filter(p => p.categoryId === categoryId)
}

export function getProductsByVendor(vendorId: string): Product[] {
  return products.filter(p => p.vendorId === vendorId)
}

export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.featured)
}

export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase()
  return products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

export function getNewArrivals(limit: number = 8): Product[] {
  return [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export function getBestSellers(limit: number = 8): Product[] {
  return [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit)
}
