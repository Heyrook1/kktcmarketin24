import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { CheckoutContent } from "./checkout-content"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ödeme",
  description: "Siparişinizi güvenle tamamlayın",
}

export default async function CheckoutPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Record<string, unknown> | null = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, address_line1, address_line2, city, district, postal_code, country")
      .eq("id", user.id)
      .single()
    profile = data
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-8 md:text-3xl">Ödeme</h1>
      <CheckoutContent user={user} profile={profile} />
    </div>
  )
}
