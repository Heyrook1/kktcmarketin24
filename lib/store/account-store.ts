"use client"

import { create } from "zustand"
import { persist } from "@/lib/zustand-middleware"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  // Delivery address (auto-filled on checkout)
  address: {
    line1: string
    line2: string
    city: string
    district: string
    postalCode: string
    country: string
  }
  avatar?: string
  loyaltyPoints: number
  memberSince: string
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

export interface OrderItem {
  productId: string
  productName: string
  vendorName: string
  imageUrl: string
  quantity: number
  price: number
  size?: string
  color?: string
}

export interface Order {
  id: string
  createdAt: string
  updatedAt: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  couponCode?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  paymentMethod?: string
  coupon?: { code: string; description: string; discount: number }
  deliveryAddress: {
    fullName: string
    phone: string
    line1: string
    city: string
    district: string
  }
  trackingNumber?: string
  estimatedDelivery?: string
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[]
}

export type CouponType = "percent" | "fixed" | "free_shipping"

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minOrderAmount: number
  expiresAt: string
  usedAt?: string
  description: string
  isActive: boolean
}

export interface Gift {
  id: string
  from: string
  message: string
  amount: number
  code: string
  expiresAt: string
  usedAt?: string
  isUsed: boolean
}

export type SupportStatus = "open" | "in_progress" | "resolved" | "closed"
export type SupportCategory =
  | "order"
  | "payment"
  | "delivery"
  | "product"
  | "return"
  | "other"

export interface SupportMessage {
  id: string
  sender: "user" | "support"
  content: string
  timestamp: string
}

export interface SupportTicket {
  id: string
  subject: string
  category: SupportCategory
  status: SupportStatus
  createdAt: string
  updatedAt: string
  relatedOrderId?: string
  messages: SupportMessage[]
}

// ─── Mock seed data ────────────────────────────────────────────────────────────

const MOCK_PROFILE: UserProfile = {
  id: "usr-001",
  firstName: "Ali",
  lastName: "Kaya",
  email: "ali.kaya@example.com",
  phone: "+90 542 123 45 67",
  birthDate: "1990-05-15",
  address: {
    line1: "Atatürk Caddesi No: 24",
    line2: "Kat 3, Daire 7",
    city: "Lefkoşa",
    district: "Merkez",
    postalCode: "99010",
    country: "KKTC",
  },
  loyaltyPoints: 2450,
  memberSince: "2023-03-10",
}

const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-20240301",
    createdAt: "2024-03-01T10:30:00Z",
    updatedAt: "2024-03-05T14:20:00Z",
    status: "delivered",
    items: [
      {
        productId: "tz-001",
        productName: "Pro Wireless Kulaklık X1",
        vendorName: "TechZone",
        imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=120&h=120&fit=crop",
        quantity: 1,
        price: 2499,
      },
    ],
    subtotal: 2499,
    shippingFee: 0,
    discount: 250,
    total: 2249,
    couponCode: "WELCOME10",
    deliveryAddress: {
      fullName: "Ali Kaya",
      phone: "+90 542 123 45 67",
      line1: "Atatürk Caddesi No: 24",
      city: "Lefkoşa",
      district: "Merkez",
    },
    trackingNumber: "TRK-789012",
    estimatedDelivery: "2024-03-05",
    statusHistory: [
      { status: "pending", timestamp: "2024-03-01T10:30:00Z", note: "Sipariş alındı" },
      { status: "confirmed", timestamp: "2024-03-01T11:00:00Z", note: "Satıcı onayladı" },
      { status: "preparing", timestamp: "2024-03-02T09:00:00Z", note: "Hazırlanıyor" },
      { status: "shipped", timestamp: "2024-03-03T14:00:00Z", note: "Kargoya verildi" },
      { status: "delivered", timestamp: "2024-03-05T14:20:00Z", note: "Teslim edildi" },
    ],
  },
  {
    id: "ORD-20240315",
    createdAt: "2024-03-15T08:45:00Z",
    updatedAt: "2024-03-16T10:00:00Z",
    status: "shipped",
    items: [
      {
        productId: "ms-001",
        productName: "Premium Deri Ceket",
        vendorName: "ModaStyle",
        imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=120&h=120&fit=crop",
        quantity: 1,
        price: 3899,
        size: "M",
        color: "Siyah",
      },
      {
        productId: "ms-005",
        productName: "Spor Koşu Ayakkabısı",
        vendorName: "ModaStyle",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop",
        quantity: 1,
        price: 1299,
        size: "42",
        color: "Beyaz",
      },
    ],
    subtotal: 5198,
    shippingFee: 49,
    discount: 0,
    total: 5247,
    deliveryAddress: {
      fullName: "Ali Kaya",
      phone: "+90 542 123 45 67",
      line1: "Atatürk Caddesi No: 24",
      city: "Lefkoşa",
      district: "Merkez",
    },
    trackingNumber: "TRK-902345",
    estimatedDelivery: "2024-03-18",
    statusHistory: [
      { status: "pending", timestamp: "2024-03-15T08:45:00Z", note: "Sipariş alındı" },
      { status: "confirmed", timestamp: "2024-03-15T09:15:00Z", note: "Satıcı onayladı" },
      { status: "preparing", timestamp: "2024-03-15T14:00:00Z", note: "Hazırlanıyor" },
      { status: "shipped", timestamp: "2024-03-16T10:00:00Z", note: "Kargoya verildi — TRK-902345" },
    ],
  },
  {
    id: "ORD-20240320",
    createdAt: "2024-03-20T16:00:00Z",
    updatedAt: "2024-03-20T16:30:00Z",
    status: "confirmed",
    items: [
      {
        productId: "gb-001",
        productName: "C Vitamini Aydınlatıcı Serum",
        vendorName: "GlowBeauty",
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=120&h=120&fit=crop",
        quantity: 2,
        price: 899,
      },
    ],
    subtotal: 1798,
    shippingFee: 0,
    discount: 0,
    total: 1798,
    deliveryAddress: {
      fullName: "Ali Kaya",
      phone: "+90 542 123 45 67",
      line1: "Atatürk Caddesi No: 24",
      city: "Lefkoşa",
      district: "Merkez",
    },
    estimatedDelivery: "2024-03-24",
    statusHistory: [
      { status: "pending", timestamp: "2024-03-20T16:00:00Z", note: "Sipariş alındı" },
      { status: "confirmed", timestamp: "2024-03-20T16:30:00Z", note: "Satıcı onayladı" },
    ],
  },
]

const MOCK_COUPONS: Coupon[] = [
  {
    id: "cpn-001",
    code: "YENI20",
    type: "percent",
    value: 20,
    minOrderAmount: 500,
    expiresAt: "2024-12-31T23:59:59Z",
    description: "Tüm siparişlerde %20 indirim",
    isActive: true,
  },
  {
    id: "cpn-002",
    code: "KARGO0",
    type: "free_shipping",
    value: 0,
    minOrderAmount: 300,
    expiresAt: "2024-06-30T23:59:59Z",
    description: "Ücretsiz kargo fırsatı",
    isActive: true,
  },
  {
    id: "cpn-003",
    code: "WELCOME10",
    type: "percent",
    value: 10,
    minOrderAmount: 0,
    expiresAt: "2024-01-31T23:59:59Z",
    usedAt: "2024-03-01T10:30:00Z",
    description: "Hoş geldiniz kuponu",
    isActive: false,
  },
  {
    id: "cpn-004",
    code: "BAHAR150",
    type: "fixed",
    value: 150,
    minOrderAmount: 1000,
    expiresAt: "2024-05-31T23:59:59Z",
    description: "Bahar kampanyası — 150₺ indirim",
    isActive: true,
  },
]

const MOCK_GIFTS: Gift[] = [
  {
    id: "gft-001",
    from: "Marketin24",
    message: "Doğum gününüz kutlu olsun! Size özel bir hediye.",
    amount: 250,
    code: "DOGUM250",
    expiresAt: "2024-12-31T23:59:59Z",
    isUsed: false,
  },
  {
    id: "gft-002",
    from: "TechZone",
    message: "Sadık müşterimize teşekkürler!",
    amount: 100,
    code: "SADIK100",
    expiresAt: "2024-04-30T23:59:59Z",
    usedAt: "2024-03-10T12:00:00Z",
    isUsed: true,
  },
]

const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "TKT-0042",
    subject: "Siparişim hâlâ teslim edilmedi",
    category: "delivery",
    status: "in_progress",
    createdAt: "2024-03-17T09:00:00Z",
    updatedAt: "2024-03-17T14:30:00Z",
    relatedOrderId: "ORD-20240315",
    messages: [
      {
        id: "msg-1",
        sender: "user",
        content: "Merhaba, ORD-20240315 numaralı siparişim 2 gündür kargoda görünüyor ama teslim edilmedi. Yardım edebilir misiniz?",
        timestamp: "2024-03-17T09:00:00Z",
      },
      {
        id: "msg-2",
        sender: "support",
        content: "Merhaba Ali Bey, talebinizi aldık. Kargo firmasıyla iletişime geçtik. En geç 24 saat içinde güncelleme yapacağız.",
        timestamp: "2024-03-17T14:30:00Z",
      },
    ],
  },
  {
    id: "TKT-0039",
    subject: "Ürün hasarlı geldi",
    category: "return",
    status: "resolved",
    createdAt: "2024-03-06T11:00:00Z",
    updatedAt: "2024-03-08T16:00:00Z",
    relatedOrderId: "ORD-20240301",
    messages: [
      {
        id: "msg-3",
        sender: "user",
        content: "Aldığım kulaklık kutusunun bir köşesi ezilmiş geldi. İade veya değişim talep ediyorum.",
        timestamp: "2024-03-06T11:00:00Z",
      },
      {
        id: "msg-4",
        sender: "support",
        content: "Üzgünüz, durumunuzu inceledik. Ürün değişimi için iade süreci başlatıldı. Kargo kodu e-postanıza gönderildi.",
        timestamp: "2024-03-08T16:00:00Z",
      },
    ],
  },
]

// ─── Store ─────────────────────────────────────────────────────────────────────

interface AccountState {
  isLoggedIn: boolean
  profile: UserProfile | null
  orders: Order[]
  coupons: Coupon[]
  gifts: Gift[]
  tickets: SupportTicket[]

  // Auth
  login: (email: string, password: string) => boolean
  logout: () => void
  register: (data: Pick<UserProfile, "firstName" | "lastName" | "email"> & { password: string }) => void

  // Profile
  updateProfile: (updates: Partial<UserProfile>) => void

  // Orders
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void
  createTicket: (ticket: Omit<SupportTicket, "id" | "createdAt" | "updatedAt" | "messages"> & { initialMessage: string }) => void
  replyToTicket: (ticketId: string, content: string) => void

  // Coupons
  addCoupon: (code: string) => { success: boolean; message: string }
  setCoupons: (coupons: Coupon[]) => void
  addOrUpdateCoupon: (coupon: Coupon) => void
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      profile: null,
      orders: [],
      coupons: [],
      gifts: [],
      tickets: [],

      login: (email, _password) => {
        // Mock auth — accept any password for the demo email
        if (email === MOCK_PROFILE.email || email !== "") {
          set({
            isLoggedIn: true,
            profile: MOCK_PROFILE,
            orders: MOCK_ORDERS,
            coupons: MOCK_COUPONS,
            gifts: MOCK_GIFTS,
            tickets: MOCK_TICKETS,
          })
          return true
        }
        return false
      },

      logout: () =>
        set({ isLoggedIn: false, profile: null, orders: [], coupons: [], gifts: [], tickets: [] }),

      register: (data) => {
        const newProfile: UserProfile = {
          id: `usr-${Date.now()}`,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: "",
          birthDate: "",
          address: { line1: "", line2: "", city: "Lefkoşa", district: "", postalCode: "", country: "KKTC" },
          loyaltyPoints: 100,
          memberSince: new Date().toISOString().split("T")[0],
        }
        set({ isLoggedIn: true, profile: newProfile, orders: [], coupons: [], gifts: [], tickets: [] })
      },

      updateProfile: (updates) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, ...updates } : null })),

      addOrder: (order) =>
        set((s) => ({ orders: [order, ...s.orders] })),

      updateOrderStatus: (orderId, status, note) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id !== orderId
              ? o
              : {
                  ...o,
                  status,
                  updatedAt: new Date().toISOString(),
                  statusHistory: [
                    ...o.statusHistory,
                    { status, timestamp: new Date().toISOString(), note },
                  ],
                }
          ),
        })),

      createTicket: ({ initialMessage, ...data }) => {
        const ticket: SupportTicket = {
          ...data,
          id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
          status: "open",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
            {
              id: `msg-${Date.now()}`,
              sender: "user",
              content: initialMessage,
              timestamp: new Date().toISOString(),
            },
          ],
        }
        set((s) => ({ tickets: [ticket, ...s.tickets] }))
      },

      replyToTicket: (ticketId, content) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  messages: [
                    ...t.messages,
                    { id: `msg-${Date.now()}`, sender: "user", content, timestamp: new Date().toISOString() },
                  ],
                }
              : t
          ),
        })),

      addCoupon: (code) => {
        const existing = get().coupons.find((c) => c.code === code)
        if (existing) return { success: false, message: "Bu kupon zaten eklenmiş." }
        // For demo, accept any code and create a generic coupon
        const newCoupon: Coupon = {
          id: `cpn-${Date.now()}`,
          code: code.toUpperCase(),
          type: "fixed",
          value: 50,
          minOrderAmount: 200,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Manuel eklenen kupon — 50₺ indirim",
          isActive: true,
        }
        set((s) => ({ coupons: [newCoupon, ...s.coupons] }))
        return { success: true, message: "Kupon başarıyla eklendi." }
      },

      setCoupons: (coupons) => set({ coupons }),

      addOrUpdateCoupon: (coupon) =>
        set((s) => {
          const exists = s.coupons.some((c) => c.id === coupon.id)
          return {
            coupons: exists
              ? s.coupons.map((c) => (c.id === coupon.id ? coupon : c))
              : [coupon, ...s.coupons],
          }
        }),
    }),
    { name: "account-store" }
  )
)
