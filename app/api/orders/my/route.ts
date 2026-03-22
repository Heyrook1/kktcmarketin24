import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch orders with items and status history in one round-trip
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
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
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[api/orders/my]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders: orders ?? [] })
  } catch (err) {
    console.error('[api/orders/my] unexpected', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
