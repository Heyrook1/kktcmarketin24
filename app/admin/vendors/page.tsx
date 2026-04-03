import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function AdminVendorsPage() {
  const supabase = await createClient()
  const { data: vendors } = await supabase
    .from("vendor_stores")
    .select("id, name, slug, description, is_active, is_verified, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vendor Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Edit vendor profile or create a new vendor account.</p>
        </div>
        <Button asChild>
          <Link href="/admin/vendors/new">Yeni Vendor</Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {["Mağaza", "Slug", "Durum", "Onay", "Oluşturma", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(vendors ?? []).map((v) => (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{v.name}</div>
                      {v.description ? <div className="text-xs text-muted-foreground line-clamp-1">{v.description}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{v.slug}</td>
                    <td className="px-4 py-3">
                      <Badge variant={v.is_active ? "default" : "secondary"}>{v.is_active ? "Aktif" : "Pasif"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={v.is_verified ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}>
                        {v.is_verified ? "Onaylı" : "Beklemede"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString("tr-TR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/vendors/${v.id}`}>Düzenle</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {(vendors ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      Henüz vendor yok.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

