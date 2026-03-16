/**
 * Stock reservation helpers using Redis.
 *
 * Key schema:
 *   cart:reserve:{cartId}:{productId}  → quantity (integer, string-serialised)
 *
 * TTL: 15 minutes (900 seconds). Refreshed on every addItem call.
 * On checkout the reservation is validated then deleted atomically.
 */

import { redis } from "@/lib/redis"

const RESERVATION_TTL = 900 // 15 minutes in seconds

function reservationKey(cartId: string, productId: string) {
  return `cart:reserve:${cartId}:${productId}`
}

/**
 * Soft-hold `quantity` units of `productId` for `cartId`.
 * Overwrites any existing reservation for that (cart, product) pair
 * and resets the TTL.
 */
export async function reserveStock(
  cartId: string,
  productId: string,
  quantity: number
): Promise<void> {
  await redis.set(reservationKey(cartId, productId), quantity, {
    ex: RESERVATION_TTL,
  })
}

/**
 * Release the soft-hold for a specific product in a cart
 * (called when item is removed or cart is cleared).
 */
export async function releaseReservation(
  cartId: string,
  productId: string
): Promise<void> {
  await redis.del(reservationKey(cartId, productId))
}

/**
 * Release ALL reservations for a cart (called after successful checkout
 * or on cart clear).
 */
export async function releaseAllReservations(cartId: string): Promise<void> {
  const pattern = `cart:reserve:${cartId}:*`
  let cursor = 0
  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: pattern,
      count: 100,
    })
    cursor = Number(nextCursor)
    if (keys.length > 0) {
      await redis.del(...(keys as string[]))
    }
  } while (cursor !== 0)
}

/**
 * Read back how many units are reserved for a (cart, product) pair.
 * Returns 0 if the key has expired or was never set.
 */
export async function getReservedQuantity(
  cartId: string,
  productId: string
): Promise<number> {
  const val = await redis.get<number>(reservationKey(cartId, productId))
  return val ?? 0
}

/**
 * Validate that a reservation exists and matches the expected quantity.
 * Returns true only if the key exists and the stored quantity >= expected.
 */
export async function validateReservation(
  cartId: string,
  productId: string,
  expectedQuantity: number
): Promise<boolean> {
  const reserved = await getReservedQuantity(cartId, productId)
  return reserved >= expectedQuantity
}
