import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react"
import Link from "next/link"

export default async function VendorProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/vendor-panel/products")

  const { data: store } = await supabase
    .from("vendor_stores").select("id, name").eq("owner_id", user.id).single()
  if (!store) redirect("/vendor-panel")

  const { data: products } = await supabase
    .from("vendor_products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  const items = products ?? []
  const activeCount = items.filter(p => p.is_active).length
  const lowStock = items.filter(p => p.stock < 5 && p.stock > 0).length
  const outOfStock = items.filter(p => p.stock === 0).length

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ürünler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} ürün — {activeCount} aktif</p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/vendor-panel/products/new"><Plus className="h-4 w-4" />Yeni Ürün</Link>
        </Button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{items.length} Toplam</Badge>
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{activeCount} Aktif</Badge>
        {lowStock > 0 && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{lowStock} Düşük Stok</Badge>}
        {outOfStock > 0 && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{outOfStock} Stok Yok</Badge>}
      </div>

      {items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Package className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Henüz ürün eklemediniz.</p>
            <Button asChild size="sm"><Link href="/vendor-panel/products/new">İlk Ürünü Ekle</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {["Ürün", "Kategori", "Fiyat", "Stok", "Durum", ""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-md object-cover border shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium line-clamp-1">{p.name}</p>
                          {p.compare_price && (
                            <p className="text-xs text-muted-foreground line-through">₺{Number(p.compare_price).toLocaleString("tr-TR")}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">₺{Number(p.price).toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${p.stock === 0 ? "text-red-600" : p.stock < 5 ? "text-amber-600" : "text-foreground"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={p.is_active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}
                      >
                        {p.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                        <Link href={`/vendor-panel/products/${p.id}`}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
