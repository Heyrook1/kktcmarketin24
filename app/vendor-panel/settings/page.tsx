import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Store, MapPin, Calendar, CheckCircle } from "lucide-react"
import { VendorProfileEditor } from "@/components/vendor/vendor-profile-editor"

export default async function VendorSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/vendor-panel/settings")

  const { data: store } = await supabase
    .from("vendor_stores").select("*").eq("owner_id", user.id).single()
  if (!store) redirect("/vendor-panel")

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Mağaza Ayarları</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Mağaza bilgileri ve durum</p>
      </div>

      <VendorProfileEditor store={store} />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />Mağaza Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mağaza Adı</p>
              <p className="font-semibold">{store.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Slug</p>
              <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{store.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Konum</p>
                <p className="font-medium">{store.location ?? "Belirtilmemiş"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Üyelik</p>
                <p className="font-medium">{new Date(store.created_at).toLocaleDateString("tr-TR")}</p>
              </div>
            </div>
          </div>

          {store.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Açıklama</p>
              <p className="text-sm text-foreground/80">{store.description}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t">
            <Badge variant={store.is_active ? "default" : "secondary"}>
              {store.is_active ? "Aktif" : "Pasif"}
            </Badge>
            {store.is_verified && (
              <Badge className="bg-emerald-100 text-emerald-800 gap-1">
                <CheckCircle className="h-3 w-3" />Onaylı Satıcı
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Hesap Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">E-posta</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Kullanıcı ID</p>
            <p className="font-mono text-xs text-muted-foreground">{user.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
