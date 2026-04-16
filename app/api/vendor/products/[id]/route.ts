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
import { revalidatePath } from 'next/cache'
import { productPatchSchema } from '@/lib/validations/product'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Fields that are safe to update — store_id and id are excluded permanently
const PATCHABLE = [
  'name', 'description', 'price', 'compare_price',
  'category', 'image_url', 'images', 'tags', 'stock',
  'is_active',
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
  try {
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
  } catch (err) {
    console.error('[vendor/products/[id] GET] unexpected:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}

// ── PATCH /api/vendor/products/[id] ──────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
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

    const parsed = productPatchSchema.safeParse(updates)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Geçersiz ürün verisi.'
      return NextResponse.json({ error: message }, { status: 422 })
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan yok.' }, { status: 422 })
    }

    const admin = adminClient()
    const { error } = await admin
      .from('vendor_products')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('store_id', auth.session.storeId) // second ownership guard in the query itself

    if (error) {
      console.error('[vendor/products PATCH]', error)
      return NextResponse.json({ error: 'Ürün güncellenemedi.' }, { status: 500 })
    }

    revalidatePath('/', 'layout')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[vendor/products/[id] PATCH] unexpected:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}

// ── DELETE /api/vendor/products/[id] ─────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
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
      .eq('store_id', auth.session.storeId) // second ownership guard

    if (error) {
      console.error('[vendor/products DELETE]', error)
      return NextResponse.json({ error: 'Ürün silinemedi.' }, { status: 500 })
    }

    revalidatePath('/', 'layout')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[vendor/products/[id] DELETE] unexpected:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
