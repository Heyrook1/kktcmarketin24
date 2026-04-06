import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fullSelect = `
        id,
        order_number,
        created_at,
        updated_at,
        saga_status,
        payment_status,
        coupon_code,
        subtotal,
        shipping_fee,
        discount_amount,
        total,
        customer_name,
        customer_phone,
        delivery_address,
        order_items (
          id,
          product_id,
          product_name,
          image_url,
          quantity,
          unit_price,
          line_total,
          store_id
        ),
        order_status_history (
          id,
          old_status,
          new_status,
          notes,
          changed_by,
          created_at
        ),
        order_vendor_sub_orders (
          id,
          store_id,
          store_name,
          step_status,
          subtotal
        ),
        vendor_orders (
          id,
          store_id,
          status,
          tracking_number,
          vendor_stores ( name )
        )
      `

    const legacySelect = `
        id,
        created_at,
        updated_at,
        saga_status,
        payment_status,
        coupon_code,
        subtotal,
        shipping_fee,
        discount_amount,
        total,
        customer_name,
        customer_phone,
        delivery_address,
        order_items (
          id,
          product_id,
          product_name,
          image_url,
          quantity,
          unit_price,
          line_total,
          store_id
        ),
        order_status_history (
          id,
          old_status,
          new_status,
          notes,
          changed_by,
          created_at
        ),
        order_vendor_sub_orders (
          id,
          store_id,
          store_name,
          step_status,
          subtotal
        )
      `

    // Fetch orders with items and status history in one round-trip
    const { data: fullOrders, error: fullErr } = await supabase
      .from('orders')
      .select(fullSelect)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    let orders = fullOrders ?? []
    if (fullErr && (
      fullErr.message.includes('order_number') ||
      fullErr.message.includes('tracking_number') ||
      fullErr.message.includes('vendor_orders')
    )) {
      const { data: legacyOrders, error: legacyErr } = await supabase
        .from('orders')
        .select(legacySelect)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (legacyErr) {
        console.error('[api/orders/my] legacy fallback failed', legacyErr)
        return NextResponse.json({ error: legacyErr.message }, { status: 500 })
      }

      orders = (legacyOrders ?? []).map((o) => ({ ...o, order_number: null, vendor_orders: [] }))
    } else if (fullErr) {
      console.error('[api/orders/my]', fullErr)
      return NextResponse.json({ error: fullErr.message }, { status: 500 })
    }

    // Legacy kayıtlar: customer_id boş ama customer_email kullanıcı ile eşleşiyor olabilir.
    if (orders.length === 0 && user.email) {
      const admin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      const { data: legacyByEmail } = await admin
        .from('orders')
        .select(legacySelect)
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false })
        .limit(30)

      orders = (legacyByEmail ?? []).map((o) => ({ ...o, order_number: null, vendor_orders: [] }))
    }

    return NextResponse.json({ orders: orders ?? [] })
  } catch (err) {
    console.error('[api/orders/my] unexpected', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
