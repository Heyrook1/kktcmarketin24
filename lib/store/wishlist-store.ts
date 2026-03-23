import { create } from "zustand"
import { persist } from "@/lib/zustand-middleware"
import type { Product } from "@/lib/data/products"

interface WishlistState {
  items: Product[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  toggleItem: (product: Product) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        if (!get().isInWishlist(product.id)) {
          set((s) => ({ items: [...s.items, product] }))
        }
      },

      removeItem: (productId) => {
        set((s) => ({ items: s.items.filter((p) => p.id !== productId) }))
      },

      toggleItem: (product) => {
        if (get().isInWishlist(product.id)) {
          get().removeItem(product.id)
        } else {
          get().addItem(product)
        }
      },

      isInWishlist: (productId) => get().items.some((p) => p.id === productId),

      clearWishlist: () => set({ items: [] }),
    }),
    { name: "marketin24-wishlist" }
  )
)
