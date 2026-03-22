import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Must run on Node.js — Supabase admin SDK is not compatible with Edge runtime
export const runtime = 'nodejs'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  let email: string
  try {
    const body = await req.json()
    email = String(body.email ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  try {
    const admin = adminClient()
    // admin.auth.admin.listUsers supports filtering by email
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })

    if (error) {
      // Fail open to avoid revealing internal errors — treat as unknown
      return NextResponse.json({ exists: null }, { status: 200 })
    }

    // listUsers doesn't support email filter directly in all versions,
    // so we use getUserByEmail which is the most reliable approach.
    const { data: userData, error: userError } =
      await admin.auth.admin.getUserByEmail(email)

    if (userError || !userData?.user) {
      return NextResponse.json({ exists: false }, { status: 200 })
    }

    return NextResponse.json({ exists: true }, { status: 200 })
  } catch {
    // Fail open — don't leak server errors to the client
    return NextResponse.json({ exists: null }, { status: 200 })
  }
}
