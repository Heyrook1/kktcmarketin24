import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { AdminVendorEditor } from "@/components/admin/admin-vendor-editor"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminVendorEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from("vendor_stores")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!vendor) notFound()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="secondary">
            <Link href="/admin/vendors">Geri</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{vendor.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Admin vendor profile edit</p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/vendors/bulk">Bulk Ürün Ekle</Link>
        </Button>
      </div>

      <AdminVendorEditor vendor={vendor as any} />

      <Card className="shadow-sm">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Bulk ürün yükleme için “Bulk Products” sayfasını kullanın. Bu sayfa, vendor profilini düzenlemek içindir.
        </CardContent>
      </Card>
    </div>
  )
}

