import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped:   ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded:  [],
}

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const { status: newStatus, notes } = await req.json() as { status: string; notes?: string }

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'orderId ve status zorunludur.' }, { status: 400 })
    }

    // Auth — must be authenticated vendor
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check vendor owns a store that has this vendor_order
    const { data: vendorOrder, error: voErr } = await supabase
      .from('vendor_orders')
      .select('id, status, store_id, vendor_stores!inner(owner_id)')
      .eq('id', orderId)
      .single()

    if (voErr || !vendorOrder) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
    }

    const ownerCheck = vendorOrder.vendor_stores as unknown as { owner_id: string }
    if (ownerCheck.owner_id !== user.id) {
      return NextResponse.json({ error: 'Bu siparişi güncelleme yetkiniz yok.' }, { status: 403 })
    }

    const currentStatus = vendorOrder.status as string
    const allowed = VALID_TRANSITIONS[currentStatus] ?? []
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `${currentStatus} → ${newStatus} geçişi geçersiz.` },
        { status: 422 }
      )
    }

    // Use admin client to bypass RLS for write
    const admin = adminClient()

    const { error: updateErr } = await admin
      .from('vendor_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Also insert into order_status_history for the parent order
    await admin.from('order_status_history').insert({
      order_id: orderId,
      old_status: currentStatus,
      new_status: newStatus,
      changed_by: 'vendor',
      notes: notes ?? null,
    })

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (err) {
    console.error('[api/orders/[id]/status]', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
