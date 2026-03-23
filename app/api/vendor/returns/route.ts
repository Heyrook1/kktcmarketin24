// GET /api/vendor/returns — vendor lists all return requests for their store
import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = getAdmin()

    // Resolve vendor store
    const { data: store } = await admin
      .from("vendor_stores")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 })

    const { data: returns, error } = await admin
      .from("returns")
      .select(`
        id,
        order_id,
        customer_id,
        reason,
        description,
        rejection_reason,
        status,
        created_at,
        updated_at,
        orders (
          id,
          customer_name,
          customer_phone,
          total,
          order_items ( product_name, quantity, image_url, unit_price )
        )
      `)
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[vendor/returns GET] error:", error)
      return NextResponse.json({ error: "İadeler yüklenemedi." }, { status: 500 })
    }

    return NextResponse.json({ returns: returns ?? [] })
  } catch (err) {
    console.error("[vendor/returns GET] unexpected:", err)
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 })
  }
}
