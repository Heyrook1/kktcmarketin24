/**
 * GET /r/[token]
 *
 * Smart Link redirect handler.
 * 1. Looks up smart_link by token (anon read via service key since slc_insert_anon needs no auth).
 * 2. Inserts an anonymous click into smart_link_clicks.
 * 3. Redirects to the appropriate destination:
 *    - store   → /vendors/[slug]
 *    - product → /products/[product_id]
 *    - campaign → /vendors/[slug] (vendor homepage with campaign tracking)
 * 4. If token is invalid or link is inactive → redirect to homepage.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"
export const dynamic = "force-dynamic"

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function hashString(str: string): string {
  // Simple deterministic hash for IP anonymisation (edge-compatible)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const baseUrl = request.nextUrl.origin

  if (!token || token.length < 3) {
    return NextResponse.redirect(new URL("/", baseUrl))
  }

  const supabase = adminClient()

  // Fetch the smart link
  const { data: link, error } = await supabase
    .from("smart_links")
    .select("id, store_id, link_type, product_id, is_active, source, campaign_name")
    .eq("link_token", token)
    .single()

  if (error || !link || !link.is_active) {
    return NextResponse.redirect(new URL("/", baseUrl))
  }

  // Fetch vendor store slug for redirect URL
  const { data: store } = await supabase
    .from("vendor_stores")
    .select("slug")
    .eq("id", link.store_id)
    .single()

  if (!store) {
    return NextResponse.redirect(new URL("/", baseUrl))
  }

  // Determine destination URL
  let destination = `/vendors/${store.slug}`
  if (link.link_type === "product" && link.product_id) {
    destination = `/products/${link.product_id}`
  }

  // Build UTM params
  const destUrl = new URL(destination, baseUrl)
  destUrl.searchParams.set("utm_source", link.source ?? "smart_link")
  destUrl.searchParams.set("utm_medium", "smart_link")
  if (link.campaign_name) {
    destUrl.searchParams.set("utm_campaign", link.campaign_name)
  }

  // Record click (fire-and-forget, don't block redirect)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  const clickPayload = {
    link_id: link.id,
    store_id: link.store_id,
    product_id: link.product_id ?? null,
    user_agent: request.headers.get("user-agent") ?? null,
    ip_hash: hashString(ip),
    utm_source: link.source ?? null,
    utm_medium: "smart_link",
    utm_campaign: link.campaign_name ?? null,
    campaign_name: link.campaign_name ?? null,
    converted: false,
    session_id: crypto.randomUUID(),
  }

  // Insert async — don't await to keep latency low
  supabase.from("smart_link_clicks").insert(clickPayload).then(() => {
    // click recorded
  })

  return NextResponse.redirect(destUrl, { status: 302 })
}
