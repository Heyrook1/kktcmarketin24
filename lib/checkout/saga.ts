/**
 * lib/checkout/saga.ts
 *
 * Multi-vendor checkout Saga orchestrator.
 *
 * Flow:
 *  1. Validate all line items: re-fetch price + store ownership from DB.
 *  2. Validate server-side coupon (if provided).
 *  3. Validate Redis reservations (soft-holds placed at add-to-cart).
 *  4. Create parent `orders` row  (saga_status = 'processing').
 *  5. For each vendor group, IN SEQUENCE:
 *       a. Atomically decrement stock via decrement_stock() RPC.
 *       b. Create `order_vendor_sub_orders` row (step_status = 'stock_reserved').
 *       c. Create `order_items` rows (immutable price snapshot).
 *       d. Insert outbox event `vendor.order.created`.
 *       If any step fails → run compensating transactions for all
 *       previously committed sub-orders (restore_stock + mark compensated)
 *       and set saga_status = 'compensating' → 'failed'.
 *  6. On full success: set saga_status = 'completed', release Redis holds.
 *
 * All DB writes use the service-role client so they bypass RLS and can
 * commit atomically across tables without needing a user session.
 */

import { createClient } from '@supabase/supabase-js'
import {
  validateReservation,
  releaseAllReservations,
} from '@/lib/stock-reservation'
import { insertOutboxEvent } from '@/lib/checkout/outbox'
import type {
  SagaInput,
  SagaResult,
  SagaLineItem,
  SagaVendorGroup,
} from '@/lib/checkout/types'

// ── Service-role Supabase client (bypasses RLS) ───────────────────────────────
function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Main orchestrator ─────────────────────────────────────────────────────────
export async function runCheckoutSaga(input: SagaInput): Promise<SagaResult> {
  const supabase = sb()

  // ── Step 1: Re-fetch authoritative product data from DB ───────────────────
  const productIds = input.rawItems.map((i) => i.productId)

  const { data: dbProducts, error: fetchErr } = await supabase
    .from('vendor_products')
    .select(`
      id, name, price, store_id, stock, is_active, image_url,
      vendor_stores ( id, name, is_active, owner_id )
    `)
    .in('id', productIds)

  if (fetchErr || !dbProducts) {
    return { ok: false, error: 'Ürün bilgileri alınamadı.' }
  }

  const productMap = new Map(dbProducts.map((p) => [p.id, p]))
  const validationErrors: string[] = []
  const verifiedItems: SagaLineItem[] = []

  for (const raw of input.rawItems) {
    const p = productMap.get(raw.productId)
    if (!p) {
      validationErrors.push(`Ürün bulunamadı (ID: ${raw.productId}).`)
      continue
    }
    if (!p.is_active) {
      validationErrors.push(`"${p.name}" artık satışta değil.`)
      continue
    }
    const store = Array.isArray(p.vendor_stores)
      ? p.vendor_stores[0]
      : p.vendor_stores
    if (!store || !store.is_active) {
      validationErrors.push(`"${p.name}" ürününün satıcısı aktif değil.`)
      continue
    }
    verifiedItems.push({
      productId: p.id,
      productName: p.name,
      quantity: raw.quantity,
      unitPrice: Number(p.price),   // DB price — authoritative
      storeId: p.store_id,
      storeName: store.name,
      lineTotal: Number(p.price) * raw.quantity,
      imageUrl: p.image_url ?? undefined,
    })
  }

  if (validationErrors.length > 0) {
    return { ok: false, error: 'Ürün doğrulama hatası.', details: validationErrors }
  }

  // ── Step 2: Server-side coupon validation ─────────────────────────────────
  let discountAmount = 0
  if (input.couponCode) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', input.couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (coupon) {
      const subtotal = verifiedItems.reduce((s, i) => s + i.lineTotal, 0)
      const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date()
      const hasUses = !coupon.max_uses || (coupon.current_uses ?? 0) < coupon.max_uses
      if (notExpired && hasUses) {
        if (coupon.type === 'percent') {
          discountAmount = Math.round(subtotal * Number(coupon.value) / 100)
        } else if (coupon.type === 'fixed') {
          discountAmount = Math.min(Number(coupon.value), subtotal)
        }
      }
    }
  }

  const serverSubtotal = verifiedItems.reduce((s, i) => s + i.lineTotal, 0)
  const serverTotal = Math.max(0, serverSubtotal - discountAmount)

  // ── Step 3: Validate Redis reservations ──────────────────────────────────
  const reservationErrors: string[] = []
  for (const item of verifiedItems) {
    const valid = await validateReservation(input.cartId, item.productId, item.quantity)
    if (!valid) {
      reservationErrors.push(
        `"${item.productName}" için rezervasyon süresi dolmuş veya eksik. Sepeti güncelleyiniz.`
      )
    }
  }
  if (reservationErrors.length > 0) {
    return { ok: false, error: 'Rezervasyon hatası.', details: reservationErrors }
  }

  // ── Step 4: Create parent order (saga_status = 'processing') ─────────────
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      customer_id: input.customerId,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone ?? null,
      delivery_address: input.deliveryAddress,
      saga_status: 'processing',
      subtotal: serverSubtotal,
      discount_amount: discountAmount,
      shipping_fee: 0,
      total: serverTotal,
      coupon_code: input.couponCode ?? null,
      payment_status: 'pending',
      cart_id: input.cartId,
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    return { ok: false, error: 'Sipariş oluşturulamadı: ' + (orderErr?.message ?? '') }
  }

  const orderId = order.id

  // ── Step 5: Group items by vendor ─────────────────────────────────────────
  const vendorMap = new Map<string, SagaVendorGroup>()
  for (const item of verifiedItems) {
    if (!vendorMap.has(item.storeId)) {
      vendorMap.set(item.storeId, {
        storeId: item.storeId,
        storeName: item.storeName,
        items: [],
        subtotal: 0,
      })
    }
    const group = vendorMap.get(item.storeId)!
    group.items.push(item)
    group.subtotal += item.lineTotal
  }

  const vendorGroups = Array.from(vendorMap.values())

  // Track committed sub-orders for compensating transactions on failure
  const committedSubOrders: {
    subOrderId: string
    storeId: string
    items: SagaLineItem[]
  }[] = []

  // ── Step 5a–d: Process each vendor group in sequence ─────────────────────
  for (const group of vendorGroups) {
    // 5a. Atomic stock decrement for each item in this vendor group
    const stockFailures: string[] = []
    for (const item of group.items) {
      const { data: success, error: rpcErr } = await supabase.rpc('decrement_stock', {
        p_product_id: item.productId,
        p_quantity: item.quantity,
      })
      if (rpcErr || !success) {
        stockFailures.push(`"${item.productName}" — stok yetersiz.`)
      }
    }

    if (stockFailures.length > 0) {
      // Compensate all previously committed sub-orders
      await compensate(supabase, orderId, committedSubOrders, stockFailures)
      return {
        ok: false,
        error: `${group.storeName} için stok hatası.`,
        details: stockFailures,
      }
    }

    // 5b. Create sub-order row
    const { data: subOrder, error: subErr } = await supabase
      .from('order_vendor_sub_orders')
      .insert({
        order_id: orderId,
        store_id: group.storeId,
        store_name: group.storeName,
        step_status: 'stock_reserved',
        subtotal: group.subtotal,
        items: group.items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
        })),
      })
      .select('id')
      .single()

    if (subErr || !subOrder) {
      await compensate(supabase, orderId, committedSubOrders, [
        `${group.storeName} alt siparişi oluşturulamadı.`,
      ])
      return { ok: false, error: 'Alt sipariş oluşturulamadı.' }
    }

    // 5c. Snapshot line items
    const lineItems = group.items.map((item) => ({
      order_id: orderId,
      sub_order_id: subOrder.id,
      product_id: item.productId,
      product_name: item.productName,
      store_id: item.storeId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
      image_url: item.imageUrl ?? null,
    }))

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(lineItems)

    if (itemsErr) {
      await compensate(supabase, orderId, committedSubOrders, [
        `${group.storeName} sipariş kalemleri kaydedilemedi.`,
      ])
      return { ok: false, error: 'Sipariş kalemleri oluşturulamadı.' }
    }

    // Track this sub-order as committed (needed for compensation)
    committedSubOrders.push({
      subOrderId: subOrder.id,
      storeId: group.storeId,
      items: group.items,
    })

    // 5d. Write outbox event (non-transactional — best-effort; worker retries)
    await insertOutboxEvent('sub_order', subOrder.id, 'vendor.order.created', {
      orderId,
      subOrderId: subOrder.id,
      storeId: group.storeId,
      storeName: group.storeName,
      subtotal: group.subtotal,
      itemCount: group.items.length,
      customerName: input.customerName,
    })

    // Mark sub-order as completed
    await supabase
      .from('order_vendor_sub_orders')
      .update({ step_status: 'completed' })
      .eq('id', subOrder.id)
  }

  // ── Step 6: Mark parent order as completed ────────────────────────────────
  await supabase
    .from('orders')
    .update({ saga_status: 'completed' })
    .eq('id', orderId)

  // Release all Redis soft-holds
  await releaseAllReservations(input.cartId)

  return {
    ok: true,
    orderId,
    serverSubtotal,
    serverTotal,
    discountAmount,
  }
}

// ── Compensating transaction ──────────────────────────────────────────────────
async function compensate(
  supabase: ReturnType<typeof sb>,
  orderId: string,
  committed: { subOrderId: string; storeId: string; items: SagaLineItem[] }[],
  reason: string[]
): Promise<void> {
  // Mark parent order as compensating
  await supabase
    .from('orders')
    .update({ saga_status: 'compensating' })
    .eq('id', orderId)

  // Restore stock for every item in every committed sub-order
  for (const sub of committed) {
    for (const item of sub.items) {
      await supabase.rpc('restore_stock', {
        p_product_id: item.productId,
        p_quantity: item.quantity,
      })
    }

    // Mark sub-order as compensated
    await supabase
      .from('order_vendor_sub_orders')
      .update({
        step_status: 'compensated',
        compensated_at: new Date().toISOString(),
        compensation_reason: reason.join('; '),
      })
      .eq('id', sub.subOrderId)

    // Emit outbox event so vendor dashboards know this sub-order was rolled back
    await insertOutboxEvent('sub_order', sub.subOrderId, 'vendor.order.compensated', {
      orderId,
      subOrderId: sub.subOrderId,
      storeId: sub.storeId,
      reason,
    })
  }

  // Mark parent order as failed
  await supabase
    .from('orders')
    .update({ saga_status: 'failed' })
    .eq('id', orderId)
}
