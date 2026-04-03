import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Store, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: vendors } = await supabase.from("vendor_stores").select("id").order("created_at", { ascending: false })
  const vendorCount = vendors?.length ?? 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vendor management & bulk product install</p>
        </div>
        <Button asChild>
          <Link href="/admin/vendors/new">Yeni Vendor</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Toplam Vendor</div>
            <div className="text-3xl font-bold mt-1">{vendorCount}</div>
            <div className="mt-4">
              <Button asChild variant="secondary">
                <Link href="/admin/vendors">Vendorları Yönet</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Bulk Product Import</div>
                <div className="text-3xl font-bold mt-1">JSON</div>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild variant="secondary">
                <Link href="/admin/vendors/bulk">Ürünleri Toplu Ekle</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

