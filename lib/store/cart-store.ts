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

// ---------------------------------------------------------------------------
// Stable cart ID — persisted in localStorage, used as Redis reservation key
// ---------------------------------------------------------------------------
function generateCartId() {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ---------------------------------------------------------------------------
// Server-side reservation helpers (fire-and-forget in the store;
// errors are surfaced in the checkout confirm step)
// ---------------------------------------------------------------------------
async function callReserve(cartId: string, productId: string, quantity: number) {
  try {
    await fetch("/api/cart/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId, productId, quantity }),
    })
  } catch {
    // Non-blocking — checkout confirm will catch any real stock issues
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

// ---------------------------------------------------------------------------
// Server cart sync — persists cart to DB keyed to user session.
// Fire-and-forget: client Zustand is the fast-path; DB is the durable backup.
// Only productId + quantity are sent — never prices (re-fetched at checkout).
// ---------------------------------------------------------------------------
async function syncServerCart(
  cartId: string,
  items: CartItem[],
  couponCode?: string
) {
  try {
    await fetch("/api/cart/server", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartId,
        items: items.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
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
          const existingItem = state.items.find(item => item.product.id === product.id)
          const newQuantity = existingItem ? existingItem.quantity + quantity : quantity
          const newItems = existingItem
            ? state.items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: newQuantity }
                  : item
              )
            : [...state.items, { product, quantity }]
          // Fire Redis reservation (non-blocking)
          callReserve(cartId, product.id, newQuantity)
          // Sync to server DB (non-blocking, only productId + quantity)
          syncServerCart(cartId, newItems, state.appliedCoupon?.code)
          return { items: newItems }
        })
      },

      removeItem: (productId: string) => {
        const { cartId, appliedCoupon } = get()
        callRelease(cartId, productId)
        set((state) => {
          const newItems = state.items.filter(item => item.product.id !== productId)
          syncServerCart(cartId, newItems, appliedCoupon?.code)
          return { items: newItems }
        })
      },

      updateQuantity: (productId: string, quantity: number) => {
        const { cartId, appliedCoupon } = get()
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        callReserve(cartId, productId, quantity)
        set((state) => {
          const newItems = state.items.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          )
          syncServerCart(cartId, newItems, appliedCoupon?.code)
          return { items: newItems }
        })
      },

      clearCart: () => {
        const { cartId } = get()
        callRelease(cartId)
        // Clear server cart after checkout
        fetch("/api/cart/server", { method: "DELETE" }).catch(() => {})
        set({ items: [], appliedCoupon: null })
      },

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
        return 0
      },

      getFinalPrice: () => {
        return Math.max(0, get().getTotalPrice() - get().getDiscountAmount())
      },

      // Coupon validation is now server-side only
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

      getItemsByVendor: () => {
        return get().items.reduce((acc, item) => {
          const vendorId = item.product.vendorId
          if (!acc[vendorId]) acc[vendorId] = []
          acc[vendorId].push(item)
          return acc
        }, {} as Record<string, CartItem[]>)
      }
    }),
    {
      name: 'marketin24-cart',
      partialize: (state) => ({
        cartId: state.cartId,
        items: state.items,
        appliedCoupon: state.appliedCoupon,
      })
    }
  )
)
