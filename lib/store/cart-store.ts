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

// Stable cart ID — persisted in localStorage, used as Redis reservation key
function generateCartId() {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// Server-side reservation helpers — fire-and-forget; errors surface at checkout confirm
async function callReserve(cartId: string, productId: string, quantity: number) {
  try {
    await fetch("/api/cart/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId, productId, quantity }),
    })
  } catch {
    // Non-blocking
  }
}

async function callRelease(cartId: string, productId?: string) {
  try {
    await fetch("/api/cart/release", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId, productId }),
    })
  } catch {
    // Non-blocking
  }
}

// Syncs cart to server DB (only productId + quantity — prices always re-fetched at checkout)
async function syncServerCart(cartId: string, items: CartItem[], couponCode?: string) {
  try {
    await fetch("/api/cart/server", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartId,
        items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        couponCode,
      }),
    })
  } catch {
    // Non-blocking
  }
}

interface CartState {
  cartId: string
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
  applyCoupon: (code: string) => Promise<CouponResult>
  removeCoupon: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: generateCartId(),
      items: [],
      isOpen: false,
      appliedCoupon: null,

      addItem: (product: Product, quantity: number = 1) => {
        const { cartId } = get()
        set((state) => {
          const existing = state.items.find(i => i.product.id === product.id)
          const newQty = existing ? existing.quantity + quantity : quantity
          const newItems = existing
            ? state.items.map(i => i.product.id === product.id ? { ...i, quantity: newQty } : i)
            : [...state.items, { product, quantity }]
          callReserve(cartId, product.id, newQty)
          syncServerCart(cartId, newItems, state.appliedCoupon?.code)
          return { items: newItems }
        })
      },

      removeItem: (productId: string) => {
        const { cartId, appliedCoupon } = get()
        callRelease(cartId, productId)
        set((state) => {
          const newItems = state.items.filter(i => i.product.id !== productId)
          syncServerCart(cartId, newItems, appliedCoupon?.code)
          return { items: newItems }
        })
      },

      updateQuantity: (productId: string, quantity: number) => {
        const { cartId, appliedCoupon } = get()
        if (quantity <= 0) { get().removeItem(productId); return }
        callReserve(cartId, productId, quantity)
        set((state) => {
          const newItems = state.items.map(i => i.product.id === productId ? { ...i, quantity } : i)
          syncServerCart(cartId, newItems, appliedCoupon?.code)
          return { items: newItems }
        })
      },

      clearCart: () => {
        const { cartId } = get()
        callRelease(cartId)
        fetch("/api/cart/server", { method: "DELETE" }).catch(() => {})
        set({ items: [], appliedCoupon: null })
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => get().items.reduce((t, i) => t + i.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce((t, i) => t + i.product.price * i.quantity, 0),

      getDiscountAmount: () => {
        const coupon = get().appliedCoupon
        if (!coupon) return 0
        const sub = get().getTotalPrice()
        if (coupon.type === "percent") return Math.round(sub * coupon.value / 100)
        if (coupon.type === "fixed") return Math.min(coupon.value, sub)
        return 0
      },

      getFinalPrice: () =>
        Math.max(0, get().getTotalPrice() - get().getDiscountAmount()),

      applyCoupon: async (code: string): Promise<CouponResult> => {
        try {
          const res = await fetch("/api/checkout/coupon", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          })
          const data = await res.json()
          if (!res.ok || !data.valid) {
            return { valid: false, message: data.message ?? "Geçersiz veya süresi dolmuş kupon kodu." }
          }
          const result: Extract<CouponResult, { valid: true }> = { valid: true, ...data }
          set({ appliedCoupon: result })
          return result
        } catch {
          return { valid: false, message: "Kupon doğrulanamadı. Lütfen tekrar deneyin." }
        }
      },

      removeCoupon: () => set({ appliedCoupon: null }),

      getItemsByVendor: () =>
        get().items.reduce((acc, item) => {
          const vid = item.product.vendorId
          if (!acc[vid]) acc[vid] = []
          acc[vid].push(item)
          return acc
        }, {} as Record<string, CartItem[]>),
    }),
    {
      name: 'marketin24-cart',
      partialize: (state) => ({
        cartId: state.cartId,
        items: state.items,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
)

