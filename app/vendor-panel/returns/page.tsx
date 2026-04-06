import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VendorReturnsClient } from "@/components/vendor/vendor-returns-client"

export const dynamic = "force-dynamic"

export default async function VendorReturnsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/vendor-panel/returns")

  const { data: store } = await supabase
    .from("vendor_stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()
  if (!store) redirect("/vendor-panel")

  return <VendorReturnsClient />
}
