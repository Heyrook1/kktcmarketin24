/**
 * GET    /api/vendor/products/[id]  — fetch single product (ownership verified)
 * PATCH  /api/vendor/products/[id]  — update product fields (ownership verified)
 * DELETE /api/vendor/products/[id]  — soft-delete product (ownership verified)
 *
 * Ownership: assertProductOwnership(id) confirms the product belongs to the
 * authenticated vendor's store before any read or write occurs.
 * store_id can NEVER be changed via PATCH — it is excluded from allowed fields.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { assertProductOwnership } from '@/lib/vendor-auth'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Fields that are safe to update — store_id and id are excluded permanently
const PATCHABLE = [
  'name', 'description', 'price', 'compare_at_price',
  'category_id', 'images', 'tags', 'sku', 'stock_quantity',
  'is_active', 'weight_grams',
] as const
type PatchableField = typeof PATCHABLE[number]

function pickPatchable(body: Record<string, unknown>): Partial<Record<PatchableField, unknown>> {
  return Object.fromEntries(
    PATCHABLE
      .filter(k => k in body)
      .map(k => [k, body[k]])
  )
}

interface RouteContext {
  params: Promise<{ id: string }>
}

// ── GET /api/vendor/products/[id] ────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const auth = await assertProductOwnership(id)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const admin = adminClient()
  const { data, error } = await admin
    .from('vendor_products')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Ürün bulunamadı.' }, { status: 404 })
  }

  return NextResponse.json({ product: data })
}

// ── PATCH /api/vendor/products/[id] ──────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const auth = await assertProductOwnership(id)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi.' }, { status: 400 })
  }

  const updates = pickPatchable(body)

  // Validate price if provided
  if ('price' in updates) {
    const price = Number(updates.price)
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: 'Fiyat sıfırdan büyük olmalıdır.' }, { status: 422 })
    }
    updates.price = price
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok.' }, { status: 422 })
  }

  const admin = adminClient()
  const { error } = await admin
    .from('vendor_products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('store_id', auth.session.storeId)  // second ownership guard in the query itself

  if (error) {
    console.error('[vendor/products PATCH]', error)
    return NextResponse.json({ error: 'Ürün güncellenemedi.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// ── DELETE /api/vendor/products/[id] ─────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const auth = await assertProductOwnership(id)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const admin = adminClient()

  // Soft-delete: set is_active = false rather than hard-deleting
  // so existing order references remain valid.
  const { error } = await admin
    .from('vendor_products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('store_id', auth.session.storeId)  // second ownership guard

  if (error) {
    console.error('[vendor/products DELETE]', error)
    return NextResponse.json({ error: 'Ürün silinemedi.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
