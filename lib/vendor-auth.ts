/**
 * lib/vendor-auth.ts
 *
 * Single source of truth for vendor ownership resolution.
 * Every mutating vendor API route must call one of these helpers
 * BEFORE touching any data. Never trust client-supplied store_id or vendor_id.
 *
 * All helpers use the SERVICE ROLE client so they bypass RLS for the
 * ownership lookup itself — the subsequent data mutations then run as
 * the authenticated user (or service role where required) and are further
 * guarded by RLS policies defined in 002_vendor_panel.sql /
 * 008_ownership_rls_hardening.sql.
 */

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { createClient as createServerClient } from '@/lib/supabase/server'

// ── Admin client (service role) ───────────────────────────────────────────────
function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role credentials are not configured.')
  return createClient(url, key)
}

// ── Result types ──────────────────────────────────────────────────────────────

export interface VendorSession {
  userId: string
  storeId: string
}

export type VendorAuthResult =
  | { ok: true; session: VendorSession }
  | { ok: false; status: 401 | 403; message: string }

export type ProductOwnershipResult =
  | { ok: true; session: VendorSession; productId: string }
  | { ok: false; status: 401 | 403 | 404; message: string }

export type OrderOwnershipResult =
  | { ok: true; session: VendorSession; vendorOrderId: string }
  | { ok: false; status: 401 | 403 | 404; message: string }

// ── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Resolves the authenticated user and their store.
 * Returns { ok: false } if the user is not authenticated or has no store.
 */
export async function resolveVendorSession(): Promise<VendorAuthResult> {
  const supabase = await createServerClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()

  if (authErr || !user) {
    return { ok: false, status: 401, message: 'Kimlik doğrulaması gerekli.' }
  }

  const admin = adminClient()
  const { data: store, error: storeErr } = await admin
    .from('vendor_stores')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (storeErr || !store) {
    return { ok: false, status: 403, message: 'Bu hesaba bağlı mağaza bulunamadı.' }
  }

  return { ok: true, session: { userId: user.id, storeId: store.id } }
}

/**
 * Resolves the vendor session and verifies that `productId` belongs to
 * their store. UUID format is validated before the DB query.
 *
 * Usage:
 *   const auth = await assertProductOwnership(params.id)
 *   if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
 */
export async function assertProductOwnership(
  productId: string
): Promise<ProductOwnershipResult> {
  if (!isUuid(productId)) {
    return { ok: false, status: 404, message: 'Geçersiz ürün kimliği.' }
  }

  const sessionResult = await resolveVendorSession()
  if (!sessionResult.ok) return sessionResult

  const { session } = sessionResult
  const admin = adminClient()

  const { data: product, error } = await admin
    .from('vendor_products')
    .select('id')
    .eq('id', productId)
    .eq('store_id', session.storeId)  // ownership: product MUST belong to this store
    .maybeSingle()

  if (error || !product) {
    return { ok: false, status: 403, message: 'Bu ürüne erişim yetkiniz yok.' }
  }

  return { ok: true, session, productId: product.id }
}

/**
 * Resolves the vendor session and verifies that the vendor_orders row
 * identified by `vendorOrderId` belongs to their store.
 */
export async function assertVendorOrderOwnership(
  vendorOrderId: string
): Promise<OrderOwnershipResult> {
  if (!isUuid(vendorOrderId)) {
    return { ok: false, status: 404, message: 'Geçersiz sipariş kimliği.' }
  }

  const sessionResult = await resolveVendorSession()
  if (!sessionResult.ok) return sessionResult

  const { session } = sessionResult
  const admin = adminClient()

  const { data: vo, error } = await admin
    .from('vendor_orders')
    .select('id')
    .eq('id', vendorOrderId)
    .eq('store_id', session.storeId)  // ownership check
    .maybeSingle()

  if (error || !vo) {
    return { ok: false, status: 403, message: 'Bu siparişe erişim yetkiniz yok.' }
  }

  return { ok: true, session, vendorOrderId: vo.id }
}

/**
 * Resolves vendor session and verifies that the delivery_event's order
 * (identified by parent order ID) belongs to their store via vendor_orders.
 */
export async function assertDeliveryEventOwnership(
  parentOrderId: string
): Promise<OrderOwnershipResult> {
  if (!isUuid(parentOrderId)) {
    return { ok: false, status: 404, message: 'Geçersiz sipariş kimliği.' }
  }

  const sessionResult = await resolveVendorSession()
  if (!sessionResult.ok) return sessionResult

  const { session } = sessionResult
  const admin = adminClient()

  const { data: vo, error } = await admin
    .from('vendor_orders')
    .select('id')
    .eq('order_id', parentOrderId)
    .eq('store_id', session.storeId)
    .maybeSingle()

  if (error || !vo) {
    return { ok: false, status: 403, message: 'Bu siparişe erişim yetkiniz yok.' }
  }

  return { ok: true, session, vendorOrderId: vo.id }
}

// ── UUID guard ────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}
