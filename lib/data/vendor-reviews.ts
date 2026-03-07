export interface VendorReview {
  id: string
  vendorId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
  helpful: number
  orderId?: string
}

export const vendorReviews: VendorReview[] = [
  {
    id: "vr-001",
    vendorId: "techzone",
    userId: "u-001",
    userName: "Ahmet K.",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop",
    rating: 5,
    title: "Harika satıcı!",
    comment: "Ürünler çok hızlı geldi, paketleme mükemmeldi. Kesinlikle tekrar alışveriş yapacağım.",
    date: "2024-02-20",
    verified: true,
    helpful: 45,
    orderId: "ORD-12345"
  },
  {
    id: "vr-002",
    vendorId: "techzone",
    userId: "u-002",
    userName: "Elif S.",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop",
    rating: 4,
    title: "İyi hizmet",
    comment: "Ürün kalitesi güzel. Kargo biraz gecikti ama satıcı ilgilendi.",
    date: "2024-02-18",
    verified: true,
    helpful: 23
  },
  {
    id: "vr-003",
    vendorId: "modastyle",
    userId: "u-003",
    userName: "Merve A.",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    rating: 5,
    title: "Beklediğimden güzel!",
    comment: "Kıyafet tam kalıp, kumaş kalitesi süper. Satıcı çok ilgili.",
    date: "2024-02-22",
    verified: true,
    helpful: 67
  },
  {
    id: "vr-004",
    vendorId: "modastyle",
    userId: "u-004",
    userName: "Can B.",
    rating: 5,
    title: "Müthiş kalite",
    comment: "Her alışverişimde memnun kalıyorum. Fiyat/performans harika.",
    date: "2024-02-15",
    verified: true,
    helpful: 34
  },
  {
    id: "vr-005",
    vendorId: "glowbeauty",
    userId: "u-005",
    userName: "Seda Y.",
    userAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=40&h=40&fit=crop",
    rating: 5,
    title: "Orijinal ürünler",
    comment: "Tüm ürünler orijinal, güvenle alışveriş yapabilirsiniz.",
    date: "2024-02-19",
    verified: true,
    helpful: 89
  },
  {
    id: "vr-006",
    vendorId: "homenest",
    userId: "u-006",
    userName: "Oğuz T.",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop",
    rating: 4,
    title: "Kaliteli ev ürünleri",
    comment: "Aldığım lamba çok şık duruyor. Tavsiye ederim.",
    date: "2024-02-17",
    verified: true,
    helpful: 28
  }
]

export function getVendorReviews(vendorId: string): VendorReview[] {
  return vendorReviews.filter(r => r.vendorId === vendorId)
}

export function getVendorAverageRating(vendorId: string): number {
  const reviews = getVendorReviews(vendorId)
  if (reviews.length === 0) return 0
  const total = reviews.reduce((sum, r) => sum + r.rating, 0)
  return Math.round((total / reviews.length) * 10) / 10
}

export function getVendorReviewCount(vendorId: string): number {
  return vendorReviews.filter(r => r.vendorId === vendorId).length
}
