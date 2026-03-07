export interface Vendor {
  id: string
  name: string
  slug: string
  description: string
  logo: string
  coverImage: string
  rating: number
  reviewCount: number
  productCount: number
  joinedDate: string
  location: string
  categories: string[]
  socialLinks: {
    instagram?: string
    facebook?: string
    twitter?: string
    website?: string
  }
  verified: boolean
}

export const vendors: Vendor[] = [
  {
    id: "techzone",
    name: "TechZone",
    slug: "techzone",
    description: "Your trusted source for the latest electronics and gadgets. We offer premium quality phones, laptops, tablets, and accessories at competitive prices. Fast shipping and excellent customer service guaranteed.",
    logo: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=300&fit=crop",
    rating: 4.8,
    reviewCount: 1247,
    productCount: 45,
    joinedDate: "2023-01",
    location: "Istanbul, Turkey",
    categories: ["electronics"],
    socialLinks: {
      instagram: "https://instagram.com/techzone",
      facebook: "https://facebook.com/techzone",
      twitter: "https://twitter.com/techzone",
      website: "https://techzone.com"
    },
    verified: true
  },
  {
    id: "modastyle",
    name: "ModaStyle",
    slug: "modastyle",
    description: "Fashion-forward clothing and accessories for the modern individual. From casual wear to elegant outfits, we bring you the latest trends at affordable prices. Quality fabrics and timeless designs.",
    logo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=300&fit=crop",
    rating: 4.6,
    reviewCount: 892,
    productCount: 62,
    joinedDate: "2023-03",
    location: "Ankara, Turkey",
    categories: ["fashion"],
    socialLinks: {
      instagram: "https://instagram.com/modastyle",
      facebook: "https://facebook.com/modastyle"
    },
    verified: true
  },
  {
    id: "homenest",
    name: "HomeNest",
    slug: "homenest",
    description: "Transform your living spaces with our curated collection of home decor, furniture, and garden essentials. We believe everyone deserves a beautiful home. Premium quality at accessible prices.",
    logo: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=300&fit=crop",
    rating: 4.7,
    reviewCount: 654,
    productCount: 38,
    joinedDate: "2023-02",
    location: "Izmir, Turkey",
    categories: ["home-garden"],
    socialLinks: {
      instagram: "https://instagram.com/homenest",
      facebook: "https://facebook.com/homenest",
      website: "https://homenest.com"
    },
    verified: true
  },
  {
    id: "glowbeauty",
    name: "GlowBeauty",
    slug: "glowbeauty",
    description: "Discover your natural glow with our premium skincare and beauty products. We source the finest ingredients for healthy, radiant skin. Cruelty-free and dermatologist tested.",
    logo: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=300&fit=crop",
    rating: 4.9,
    reviewCount: 1456,
    productCount: 54,
    joinedDate: "2023-01",
    location: "Istanbul, Turkey",
    categories: ["beauty"],
    socialLinks: {
      instagram: "https://instagram.com/glowbeauty",
      facebook: "https://facebook.com/glowbeauty",
      twitter: "https://twitter.com/glowbeauty"
    },
    verified: true
  },
  {
    id: "sportmax",
    name: "SportMax",
    slug: "sportmax",
    description: "Gear up for greatness with our sports and fitness equipment. From gym essentials to outdoor adventure gear, we have everything you need to stay active and healthy.",
    logo: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop",
    rating: 4.5,
    reviewCount: 578,
    productCount: 41,
    joinedDate: "2023-04",
    location: "Bursa, Turkey",
    categories: ["sports"],
    socialLinks: {
      instagram: "https://instagram.com/sportmax",
      facebook: "https://facebook.com/sportmax"
    },
    verified: true
  },
  {
    id: "kidworld",
    name: "KidWorld",
    slug: "kidworld",
    description: "Making childhood magical with our selection of toys, clothing, and essentials for babies and kids. Safe, fun, and educational products that parents can trust.",
    logo: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=300&fit=crop",
    rating: 4.8,
    reviewCount: 823,
    productCount: 33,
    joinedDate: "2023-02",
    location: "Antalya, Turkey",
    categories: ["kids-baby"],
    socialLinks: {
      instagram: "https://instagram.com/kidworld",
      facebook: "https://facebook.com/kidworld"
    },
    verified: true
  },
  {
    id: "luxeaccessories",
    name: "LuxeAccessories",
    slug: "luxeaccessories",
    description: "Elevate your style with our collection of fine jewelry, watches, and premium accessories. Timeless pieces that make a statement. Authenticity guaranteed.",
    logo: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=300&fit=crop",
    rating: 4.7,
    reviewCount: 412,
    productCount: 29,
    joinedDate: "2023-05",
    location: "Istanbul, Turkey",
    categories: ["jewelry"],
    socialLinks: {
      instagram: "https://instagram.com/luxeaccessories",
      website: "https://luxeaccessories.com"
    },
    verified: true
  },
  {
    id: "freshmart",
    name: "FreshMart",
    slug: "freshmart",
    description: "Your neighborhood grocery store, now online. Fresh produce, quality pantry staples, and healthy options delivered to your door. Supporting local farmers and sustainable practices.",
    logo: "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=300&fit=crop",
    rating: 4.6,
    reviewCount: 967,
    productCount: 67,
    joinedDate: "2023-01",
    location: "Istanbul, Turkey",
    categories: ["groceries", "health"],
    socialLinks: {
      instagram: "https://instagram.com/freshmart",
      facebook: "https://facebook.com/freshmart"
    },
    verified: true
  }
]

export function getVendorById(id: string): Vendor | undefined {
  return vendors.find(v => v.id === id)
}

export function getVendorBySlug(slug: string): Vendor | undefined {
  return vendors.find(v => v.slug === slug)
}

export function getVendorsByCategory(categoryId: string): Vendor[] {
  return vendors.filter(v => v.categories.includes(categoryId))
}
