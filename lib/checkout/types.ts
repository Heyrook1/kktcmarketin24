/**
 * lib/checkout/types.ts
 *
 * Shared types for the multi-vendor Saga checkout pipeline.
 */

export interface SagaLineItem {
  productId: string
  productName: string
  quantity: number
  /** Server-fetched unit price — never from client */
  unitPrice: number
  storeId: string
  storeName: string
  lineTotal: number
  imageUrl?: string
}

export interface SagaVendorGroup {
  storeId: string
  storeName: string
  items: SagaLineItem[]
  subtotal: number
}

export interface SagaInput {
  cartId: string
  customerId: string | null
  customerName: string
  customerEmail: string
  customerPhone?: string
  deliveryAddress: {
    fullName: string
    phone: string
    line1: string
    city: string
    district: string
  }
  couponCode?: string
  /** Raw items from cart — productId + quantity only; prices re-fetched from DB */
  rawItems: { productId: string; quantity: number }[]
}

export type SagaStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'compensating'
  | 'failed'

export type SubOrderStepStatus =
  | 'pending'
  | 'stock_reserved'
  | 'completed'
  | 'compensated'
  | 'failed'

export interface SagaResult {
  ok: boolean
  orderId?: string
  serverSubtotal?: number
  serverTotal?: number
  discountAmount?: number
  error?: string
  details?: string[]
}
