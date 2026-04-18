// PATCH /api/returns/[id] — vendor updates return status
// Body: { action: "approve" | "reject" | "complete", rejection_reason?: string }
import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { z } from "zod"

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const ACTION_TO_STATUS: Record<string, string> = {
  approve:  "approved",
  reject:   "rejected",
  complete: "completed",
}

const returnIdSchema = z.string().uuid("Geçersiz iade kimliği.")

const RETURN_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  requested: ["approved", "rejected"],
  approved: ["completed"],
  rejected: [],
  completed: [],
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params
    const parsedId = returnIdSchema.safeParse(rawId)
    if (!parsedId.success) {
      return NextResponse.json({ error: parsedId.error.issues[0]?.message ?? "Geçersiz iade kimliği." }, { status: 400 })
    }
    const id = parsedId.data

    // ── Auth ───────────────────────────────────────────────────────────────
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 })

    const body = await req.json()
    const { action, rejection_reason } = body as {
      action:            "approve" | "reject" | "complete"
      rejection_reason?: string
    }

    const newStatus = ACTION_TO_STATUS[action]
    if (!newStatus)
      return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 })
    if (action === "reject" && !rejection_reason?.trim())
      return NextResponse.json({ error: "Red nedeni giriniz." }, { status: 400 })

    const admin = getAdmin()

    // ── Verify return exists and belongs to this vendor ────────────────────
    const { data: ret, error: fetchErr } = await admin
      .from("returns")
      .select("id, store_id, status")
      .eq("id", id)
      .single()

    if (fetchErr || !ret)
      return NextResponse.json({ error: "İade talebi bulunamadı." }, { status: 404 })

    // Check vendor owns the store
    const { data: store } = await admin
      .from("vendor_stores")
      .select("id")
      .eq("id", ret.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store)
      return NextResponse.json({ error: "Bu iade size ait değil." }, { status: 403 })

    const allowed = RETURN_ALLOWED_TRANSITIONS[ret.status] ?? []
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `"${ret.status}" durumundan "${newStatus}" durumuna geçiş yapılamaz.`, allowedNext: allowed },
        { status: 422 }
      )
    }

    // ── Build update payload ───────────────────────────────────────────────
    const updatePayload: Record<string, string | null> = { status: newStatus }
    if (action === "reject") updatePayload.rejection_reason = rejection_reason!.trim()

    const { error: updateErr } = await admin
      .from("returns")
      .update(updatePayload)
      .eq("id", id)

    if (updateErr) {
      console.error("[returns/PATCH] update error:", updateErr)
      return NextResponse.json({ error: "İade durumu güncellenemedi." }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error("[returns/PATCH] unexpected error:", err)
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 })
  }
}

// GET /api/returns/[id] — vendor fetches single return detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params
    const parsedId = returnIdSchema.safeParse(rawId)
    if (!parsedId.success) {
      return NextResponse.json({ error: parsedId.error.issues[0]?.message ?? "Geçersiz iade kimliği." }, { status: 400 })
    }
    const id = parsedId.data
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = getAdmin()
    const { data, error } = await admin
      .from("returns")
      .select("*, orders(id, customer_name, customer_phone, total, order_items(product_name, quantity, image_url))")
      .eq("id", id)
      .single()

    if (error || !data)
      return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })

    const { data: store } = await admin
      .from("vendor_stores")
      .select("id")
      .eq("id", data.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Bu iade size ait değil." }, { status: 403 })
    }

    return NextResponse.json({ return: data })
  } catch (err) {
    console.error("[returns/GET] unexpected error:", err)
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 })
  }
}
