export function cartSessionKey(userId: string): string {
  return `cart:${userId}:session`
}

export function legacyCartSessionKey(userId: string): string {
  return `cart:session:${userId}`
}

export function cartReservationKey(cartId: string, productId: string): string {
  return `cart:${cartId}:reserve:${productId}`
}

export function cartReservationPattern(cartId: string): string {
  return `cart:${cartId}:reserve:*`
}

export function vendorNotificationKey(storeId: string): string {
  return `vendor:${storeId}:notify`
}

export function rateLimitKey(entity: string, id: string, action: string): string {
  return `${entity}:${id}:${action}`
}

export const redisKeys = {
  cartSession: cartSessionKey,
  legacyCartSession: legacyCartSessionKey,
  cartReserve: cartReservationKey,
  cartReservePattern: cartReservationPattern,
  vendorNotify: vendorNotificationKey,
  rateLimit: rateLimitKey,
} as const
