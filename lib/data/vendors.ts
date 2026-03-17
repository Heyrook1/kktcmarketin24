export interface Vendor {
  id: string
  name: string
  slug: string
  description: string
  logo: string
  coverImage: string
  rating: number
  // reviewCount and productCount are NOT stored here — always compute at call-site:
  //   reviewCount → getVendorReviews(id).length
  //   productCount → getProductsByVendor(id).length
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
    name: "TechZone KKTC",
    slug: "techzone",
    description: "KKTC'nin en güvenilir elektronik mağazası. En son model telefonlar, bilgisayarlar, tabletler ve aksesuarları rekabetçi fiyatlarla sunuyoruz. Hızlı teslimat ve mükemmel müşteri hizmetleri garantisi.",
    logo: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=300&fit=crop",
    rating: 4.8,
    joinedDate: "2023-01",
    location: "Lefkoşa, KKTC",
    categories: ["electronics"],
    socialLinks: {
      instagram: "https://instagram.com/techzonekktc",
      facebook: "https://facebook.com/techzonekktc",
      twitter: "https://twitter.com/techzonekktc",
      website: "https://techzone.com.tr"
    },
    verified: true
  },
  {
    id: "modastyle",
    name: "Kıbrıs Moda",
    slug: "modastyle",
    description: "Modern bireyler için trend giyim ve aksesuarlar. Günlük kıyafetlerden şık görünümlere, en son trendleri uygun fiyatlarla sunuyoruz. Kaliteli kumaşlar ve zamansız tasarımlar.",
    logo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=300&fit=crop",
    rating: 4.6,
    joinedDate: "2023-03",
    location: "Girne, KKTC",
    categories: ["fashion"],
    socialLinks: {
      instagram: "https://instagram.com/kibrismoda",
      facebook: "https://facebook.com/kibrismoda"
    },
    verified: true
  },
  {
    id: "homenest",
    name: "Ev Sanat",
    slug: "homenest",
    description: "Yaşam alanlarınızı ev dekorasyon, mobilya ve bahçe ürünleri koleksiyonumuzla dönüştürün. Herkesin güzel bir eve hak ettiğine inanıyoruz. Erişilebilir fiyatlarla premium kalite.",
    logo: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=300&fit=crop",
    rating: 4.7,
    joinedDate: "2023-02",
    location: "Gazimağusa, KKTC",
    categories: ["home-garden"],
    socialLinks: {
      instagram: "https://instagram.com/evsanat",
      facebook: "https://facebook.com/evsanat",
      website: "https://evsanat.com"
    },
    verified: true
  },
  {
    id: "glowbeauty",
    name: "Güzellik Evi",
    slug: "glowbeauty",
    description: "Premium cilt bakımı ve güzellik ürünlerimizle doğal parlaklığınızı keşfedin. Sağlıklı, parlak cilt için en kaliteli içerikleri kullanıyoruz. Hayvan deneyi yapılmamış ve dermatolog onaylı.",
    logo: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=300&fit=crop",
    rating: 4.9,
    joinedDate: "2023-01",
    location: "Lefkoşa, KKTC",
    categories: ["beauty"],
    socialLinks: {
      instagram: "https://instagram.com/guzellikevi",
      facebook: "https://facebook.com/guzellikevi",
      twitter: "https://twitter.com/guzellikevi"
    },
    verified: true
  },
  {
    id: "sportmax",
    name: "Spor Merkezi",
    slug: "sportmax",
    description: "Spor ve fitness ekipmanlarımızla mükemmelliğe hazırlanın. Spor salonu gereksinimlerinden açık hava macera malzemelerine kadar, aktif ve sağlıklı kalmanız için ihtiyacınız olan her şey.",
    logo: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop",
    rating: 4.5,
    joinedDate: "2023-04",
    location: "Güzelyurt, KKTC",
    categories: ["sports"],
    socialLinks: {
      instagram: "https://instagram.com/spormerkezi",
      facebook: "https://facebook.com/spormerkezi"
    },
    verified: true
  },
  {
    id: "kidworld",
    name: "Çocuk Dünyası",
    slug: "kidworld",
    description: "Oyuncak, giyim ve bebek-çocuk ürünleri seçkimizle çocukluğu sihirli hale getiriyoruz. Ebeveynlerin güvenebileceği güvenli, eğlenceli ve eğitici ürünler.",
    logo: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=300&fit=crop",
    rating: 4.8,
    joinedDate: "2023-02",
    location: "Girne, KKTC",
    categories: ["kids-baby"],
    socialLinks: {
      instagram: "https://instagram.com/cocukdunyasi",
      facebook: "https://facebook.com/cocukdunyasi"
    },
    verified: true
  },
  {
    id: "luxeaccessories",
    name: "Lüks Aksesuar",
    slug: "luxeaccessories",
    description: "Değerli takılar, saatler ve premium aksesuar koleksiyonumuzla tarzınızı yükseltin. Fark yaratan zamansız parçalar. Orijinallik garantili.",
    logo: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=300&fit=crop",
    rating: 4.7,
    joinedDate: "2023-05",
    location: "Lefkoşa, KKTC",
    categories: ["jewelry"],
    socialLinks: {
      instagram: "https://instagram.com/luksaksesuar",
      website: "https://luksaksesuar.com"
    },
    verified: true
  },
  {
    id: "freshmart",
    name: "Taze Market",
    slug: "freshmart",
    description: "Mahallenizin marketi artık online. Taze ürünler, kaliteli gıdalar ve sağlıklı seçenekler kapınıza teslim. Yerel çiftçileri ve sürdürülebilir uygulamaları destekliyoruz.",
    logo: "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=100&h=100&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=300&fit=crop",
    rating: 4.6,
    joinedDate: "2023-01",
    location: "Lefkoşa, KKTC",
    categories: ["groceries", "health"],
    socialLinks: {
      instagram: "https://instagram.com/tazemarket",
      facebook: "https://facebook.com/tazemarket"
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
