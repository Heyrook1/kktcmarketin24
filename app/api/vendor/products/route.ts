/**
 * GET  /api/vendor/products        — list all products for the authenticated vendor's store
 * POST /api/vendor/products        — create a new product for the authenticated vendor's store
 *
 * Ownership: resolveVendorSession() is called on every request.
 * The store_id is injected server-side — never accepted from the client body.
 * Prices must be positive numbers; category_id is required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveVendorSession } from '@/lib/vendor-auth'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Allowed fields from the request body — store_id is ALWAYS injected server-side
const ALLOWED_FIELDS = [
  'name', 'description', 'price', 'compare_price',
  'category_id', 'image_url', 'images', 'tags', 'sku', 'stock',
  'is_active',
] as const
type AllowedField = typeof ALLOWED_FIELDS[number]

function pickAllowed(body: Record<string, unknown>): Partial<Record<AllowedField, unknown>> {
  return Object.fromEntries(
    ALLOWED_FIELDS
      .filter(k => k in body)
      .map(k => [k, body[k]])
  )
}

// ── GET /api/vendor/products ─────────────────────────────────────────────────
export async function GET() {
  const auth = await resolveVendorSession()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const admin = adminClient()
  const { data, error } = await admin
    .from('vendor_products')
    .select('*')
    .eq('store_id', auth.session.storeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[vendor/products GET]', error)
    return NextResponse.json({ error: 'Ürünler yüklenemedi.' }, { status: 500 })
  }

  return NextResponse.json({ products: data })
}

// ── POST /api/vendor/products ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await resolveVendorSession()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi.' }, { status: 400 })
  }

  // Validate required fields
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return NextResponse.json({ error: 'Ürün adı zorunludur.' }, { status: 422 })
  }
  const price = Number(body.price)
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'Fiyat sıfırdan büyük olmalıdır.' }, { status: 422 })
  }
  if (!body.category_id) {
    return NextResponse.json({ error: 'Kategori zorunludur.' }, { status: 422 })
  }

  const allowed = pickAllowed(body)

  const admin = adminClient()
  const { data, error } = await admin
    .from('vendor_products')
    .insert({
      ...allowed,
      store_id: auth.session.storeId,  // always server-injected — never client-supplied
      price,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[vendor/products POST]', error)
    return NextResponse.json({ error: 'Ürün oluşturulamadı.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, productId: data.id }, { status: 201 })
}
