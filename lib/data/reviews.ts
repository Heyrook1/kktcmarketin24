export interface VendorReply {
  vendorId: string
  vendorName: string
  vendorLogo: string
  reply: string
  date: string
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
  helpful: number
  images?: string[]
  vendorReply?: VendorReply
}

export const reviews: Review[] = [
  // TechZone Products
  {
    id: "r-001",
    productId: "tz-001",
    userId: "u-001",
    userName: "Mehmet Y.",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop",
    rating: 5,
    title: "Mükemmel ses kalitesi!",
    comment: "Gürültü engelleme özelliği gerçekten harika. Uzun süre rahat kullanabiliyorum.",
    date: "2024-02-15",
    verified: true,
    helpful: 24,
    vendorReply: {
      vendorId: "techzone",
      vendorName: "TechZone KKTC",
      vendorLogo: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=40&h=40&fit=crop",
      reply: "Memnuniyetiniz bizim için çok önemli! Ürünümüzü tercih ettiğiniz için teşekkür ederiz. Sorun yaşarsanız her zaman buradayız.",
      date: "2024-02-16"
    }
  },
  {
    id: "r-002",
    productId: "tz-001",
    userId: "u-002",
    userName: "Ayşe K.",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop",
    rating: 4,
    title: "Güzel ürün",
    comment: "Batarya ömrü söylendiği gibi. Sadece şarj süresi biraz uzun.",
    date: "2024-02-10",
    verified: true,
    helpful: 12
  },
  {
    id: "r-003",
    productId: "tz-002",
    userId: "u-003",
    userName: "Ali R.",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop",
    rating: 5,
    title: "Spor için ideal",
    comment: "Nabız ölçümü çok hassas. Her gün kullanıyorum, pil 5 gün yetiyor.",
    date: "2024-02-08",
    verified: true,
    helpful: 18
  },
  {
    id: "r-004",
    productId: "ms-001",
    userId: "u-004",
    userName: "Zeynep M.",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    rating: 5,
    title: "Tam kalıp!",
    comment: "42 numara tam oturdu. Kumaşı çok yumuşak ve rahat.",
    date: "2024-02-12",
    verified: true,
    helpful: 31,
    vendorReply: {
      vendorId: "modastyle",
      vendorName: "Kıbrıs Moda",
      vendorLogo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=40&h=40&fit=crop",
      reply: "Değerli yorumunuz için teşekkür ederiz! Ürünlerimizin beğenilmesi bizi çok mutlu ediyor. Yeni koleksiyonlarımızı da takip etmeyi unutmayın.",
      date: "2024-02-13"
    }
  },
  {
    id: "r-005",
    productId: "ms-001",
    userId: "u-005",
    userName: "Emre T.",
    rating: 4,
    title: "Kaliteli ürün",
    comment: "Normal beden alın, biraz bol oluyor. Renk fotoğraftaki gibi.",
    date: "2024-02-05",
    verified: true,
    helpful: 15
  },
  {
    id: "r-006",
    productId: "ms-002",
    userId: "u-006",
    userName: "Fatma B.",
    userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop",
    rating: 5,
    title: "Şık ve zarif",
    comment: "Düğünde giydim herkes çok beğendi. Kalitesi süper!",
    date: "2024-02-18",
    verified: true,
    helpful: 42
  },
  {
    id: "r-007",
    productId: "gb-001",
    userId: "u-007",
    userName: "Seda A.",
    userAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=40&h=40&fit=crop",
    rating: 5,
    title: "Cildim çok güzelleşti",
    comment: "2 haftadır kullanıyorum, sivilcelerim azaldı. Kesinlikle tavsiye ederim.",
    date: "2024-02-20",
    verified: true,
    helpful: 56,
    vendorReply: {
      vendorId: "glowbeauty",
      vendorName: "Güzellik Evi",
      vendorLogo: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=40&h=40&fit=crop",
      reply: "Sonuçlardan memnun olduğunuzu duymak harika! Ürünlerimiz dermatolog onaylı ve doğal içerikler kullanılarak üretilmektedir. Sağlıklı güzelliğiniz için buradayız.",
      date: "2024-02-21"
    }
  },
  {
    id: "r-008",
    productId: "gb-002",
    userId: "u-008",
    userName: "Deniz K.",
    rating: 4,
    title: "Güzel koku",
    comment: "Kalıcılığı ortalama ama kokusu çok hoş. Günlük kullanım için ideal.",
    date: "2024-02-14",
    verified: true,
    helpful: 8
  }
]

export function getProductReviews(productId: string): Review[] {
  return reviews.filter(r => r.productId === productId)
}

export function getAverageRating(productId: string): number {
  const productReviews = getProductReviews(productId)
  if (productReviews.length === 0) return 0
  const total = productReviews.reduce((sum, r) => sum + r.rating, 0)
  return Math.round((total / productReviews.length) * 10) / 10
}
