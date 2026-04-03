import { createClient } from "@/lib/supabase/server"
import { BulkProductsImport } from "@/components/admin/bulk-products-import"

export const dynamic = "force-dynamic"

export default async function AdminBulkProductsPage() {
  const supabase = await createClient()
  const { data: vendors } = await supabase
    .from("vendor_stores")
    .select("id, name")
    .order("created_at", { ascending: false })

  return <BulkProductsImport vendors={(vendors ?? []).map((v) => ({ id: v.id, name: v.name }))} />
}

