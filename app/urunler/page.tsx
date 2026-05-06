import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { ChevronRight, ShieldCheck, Package, Truck } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ProductsContent, ProductsContentSkeleton } from "@/app/products/products-content"
import { categories } from "@/lib/data/categories"
import { mapVendorProductRowToListProduct } from "@/lib/map-vendor-product-list"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Tüm Ürünler | Marketin24",
  description:
    "Marketin24'te onaylı satıcılardan tüm ürünleri keşfedin. Elektronik, giyim, ev & yaşam ve daha fazlası.",
  openGraph: {
    title: "Tüm Ürünler | Marketin24",
    description: "Onaylı satıcılarımızdan yüzlerce ürünü keşfedin.",
  },
}

export default async function UrunlerPage() {
  const supabase = await createClient()

  const [{ data: rawProducts }, { data: rawStores }] = await Promise.all([
    supabase
      .from("vendor_products")
      .select(
        "id, name, description, price, compare_price, category, image_url, images, tags, is_active, stock, created_at, store_id, vendor_stores(id, name, slug)"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("vendor_stores")
      .select("id, name, slug")
      .eq("is_active", true),
  ])

  const initialProducts = (rawProducts ?? []).map((p) =>
    mapVendorProductRowToListProduct(
      p as Parameters<typeof mapVendorProductRowToListProduct>[0]
    )
  )

  const usedCatIds = [
    ...new Set(initialProducts.map((p) => p.categoryId).filter(Boolean)),
  ]
  const initialCategories = usedCatIds.map((id) => {
    const cat = categories.find((c) => c.id === id)
    return {
      id,
      slug:          cat?.slug ?? id,
      name:          cat?.name ?? id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
      description:   cat?.description ?? "",
      image:         cat?.image ?? "",
      icon:          cat?.icon ?? "",
      subcategories: cat?.subcategories ?? [],
      productCount:  initialProducts.filter((p) => p.categoryId === id).length,
    }
  }) as import("@/lib/data/categories").Category[]

  const initialVendors = (rawStores ?? []).map((s) => ({
    id:           s.id,
    name:         s.name,
    slug:         s.slug,
    description:  "",
    logo:         "",
    coverImage:   "",
    rating:       0,
    reviewCount:  0,
    productCount: initialProducts.filter((p) => p.vendorId === s.id).length,
    isVerified:   true,
    joinedDate:   "",
    location:     "KKTC",
    categories:   [] as string[],
    socialLinks:  {},
  })) as unknown as import("@/lib/data/vendors").Vendor[]

  return (
    <>
      {/* Hero banner */}
      <div className="bg-gradient-to-b from-primary/5 via-primary/[0.03] to-background border-b">
        <div className="container mx-auto px-4 py-5 md:py-7">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Tüm Ürünler</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Tüm Ürünler</h1>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-semibold text-foreground">{initialProducts.length}</span>{" "}
                ürün &mdash; Onaylı satıcılarımızdan keşfedin
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Onaylı Satıcılar
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-primary" />
                KKTC Kargo
              </span>
              <span className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-primary" />
                Ücretsiz İade
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <Suspense fallback={<ProductsContentSkeleton />}>
          <ProductsContent
            initialProducts={initialProducts}
            initialCategories={initialCategories}
            initialVendors={initialVendors}
          />
        </Suspense>
      </div>
    </>
  )
}
