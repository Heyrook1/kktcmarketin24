import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/lib/data/products'

export interface CartItem {
  product: Product
  quantity: number
}

export type CouponResult =
  | { valid: true; code: string; type: "percent" | "fixed" | "free_shipping"; value: number; description: string }
  | { valid: false; message: string }

// Demo coupon codes — in production these come from the backend
const VALID_COUPONS: Record<string, Omit<Extract<CouponResult, { valid: true }>, "valid">> = {
  YENI20:   { code: "YENI20",   type: "percent",      value: 20,  description: "Tüm siparişlerde %20 indirim" },
  KARGO0:   { code: "KARGO0",   type: "free_shipping",value: 0,   description: "Ücretsiz kargo" },
  BAHAR150: { code: "BAHAR150", type: "fixed",         value: 150, description: "Bahar kampanyası — 150₺ indirim" },
  WELCOME10:{ code: "WELCOME10",type: "percent",       value: 10,  description: "Hoş geldiniz kuponu" },
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  appliedCoupon: Extract<CouponResult, { valid: true }> | null
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getDiscountAmount: () => number
  getFinalPrice: () => number
  getItemsByVendor: () => Record<string, CartItem[]>
  applyCoupon: (code: string) => CouponResult
  removeCoupon: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,

      addItem: (product: Product, quantity: number = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === product.id)
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            }
          }
          return { items: [...state.items, { product, quantity }] }
        })
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId)
        }))
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          )
        }))
      },

      clearCart: () => set({ items: [], appliedCoupon: null }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        )
      },

      getDiscountAmount: () => {
        const coupon = get().appliedCoupon
        if (!coupon) return 0
        const subtotal = get().getTotalPrice()
        if (coupon.type === "percent") return Math.round(subtotal * coupon.value / 100)
        if (coupon.type === "fixed")   return Math.min(coupon.value, subtotal)
        return 0 // free_shipping handled separately in UI
      },

      getFinalPrice: () => {
        return Math.max(0, get().getTotalPrice() - get().getDiscountAmount())
      },

      applyCoupon: (code) => {
        const normalized = code.trim().toUpperCase()
        const coupon = VALID_COUPONS[normalized]
        if (!coupon) return { valid: false, message: "Geçersiz veya süresi dolmuş kupon kodu." }
        const result: Extract<CouponResult, { valid: true }> = { valid: true, ...coupon }
        set({ appliedCoupon: result })
        return result
      },

      removeCoupon: () => set({ appliedCoupon: null }),

      getItemsByVendor: () => {
        return get().items.reduce((acc, item) => {
          const vendorId = item.product.vendorId
          if (!acc[vendorId]) {
            acc[vendorId] = []
          }
          acc[vendorId].push(item)
          return acc
        }, {} as Record<string, CartItem[]>)
      }
    }),
    {
      name: 'marketin24-cart',
      partialize: (state) => ({ items: state.items, appliedCoupon: state.appliedCoupon })
    }
  )
)
