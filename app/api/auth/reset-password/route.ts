import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdmin } from "@supabase/supabase-js"

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email?: string }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()
    const admin = adminClient()

    // Check if email exists in auth.users via listUsers + filter.
    // getUserByEmail was removed in @supabase/supabase-js v2 — listUsers is the correct API.
    const { data: listData, error: listErr } = await admin.auth.admin.listUsers({
      perPage: 1000,
    })

    if (listErr) {
      console.error("[reset-password] listUsers error:", listErr)
      return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
    }

    const matchedUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === normalised
    )

    if (!matchedUser) {
      return NextResponse.json(
        { error: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." },
        { status: 404 }
      )
    }

    // Email exists — generate and send the password reset link
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const redirectTo = `${origin}/auth/update-password`

    const { error: resetErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: normalised,
      options: { redirectTo },
    })

    if (resetErr) {
      console.error("[reset-password] generateLink error:", resetErr)
      return NextResponse.json(
        { error: "Sıfırlama bağlantısı gönderilemedi. Lütfen daha sonra tekrar deneyin." },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[reset-password] unexpected:", err)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}


function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email?: string }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()
    const admin = adminClient()

    // Step 1: Check whether this email exists in auth.users via profiles table.
    // profiles.id = auth.users.id, and profiles has no email column — so we use
    // the admin API's listUsers with a filter to find the user by email.
    const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({
      perPage: 1,
    })

    if (listErr) {
      console.error("[reset-password]", listErr)
      // Fail open — don't leak whether the error is auth-related
      return NextResponse.json({ ok: true })
    }

    // Efficient lookup: use admin.auth.admin.getUserByEmail if available,
    // otherwise fall back to listing and filtering (Supabase JS v2 supports getUserByEmail)
    const { data: userData, error: userErr } = await admin.auth.admin.getUserByEmail(normalised)

    if (userErr || !userData?.user) {
      // Email not found in the system — return specific error
      return NextResponse.json(
        { error: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." },
        { status: 404 }
      )
    }

    // Step 2: Email exists — generate and send the password reset link
    const redirectTo = `${req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/update-password`

    const { error: resetErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: normalised,
      options: { redirectTo },
    })

    if (resetErr) {
      console.error("[reset-password] generateLink error:", resetErr)
      return NextResponse.json(
        { error: "Sıfırlama bağlantısı gönderilemedi. Lütfen daha sonra tekrar deneyin." },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[reset-password] unexpected:", err)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
