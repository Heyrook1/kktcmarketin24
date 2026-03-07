import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/lib/data/products'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemsByVendor: () => Record<string, CartItem[]>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

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

      clearCart: () => set({ items: [] }),

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
      partialize: (state) => ({ items: state.items })
    }
  )
)
