import { buildSearchAliases } from "@/lib/smart-search"
import { normalizeCat } from "@/lib/normalize-product-category"
import type { Product } from "@/lib/data/products"

type VendorStoreEmbed = { id: string; name: string; slug: string } | null

export type RawVendorProductListRow = {
  id: string
  name: string
  description: string | null
  price: number | string
  compare_price: number | string | null
  category: string | null
  image_url: string | null
  images: unknown
  tags: unknown
  stock: number | null
  created_at: string
  store_id: string
  vendor_stores?: unknown
}

export type ProductListItem = Product & {
  vendorName: string
  searchAliases: string
  stock: number
}

export function mapVendorProductRowToListProduct(p: RawVendorProductListRow): ProductListItem {
  const store = Array.isArray(p.vendor_stores)
    ? (p.vendor_stores[0] as VendorStoreEmbed)
    : (p.vendor_stores as VendorStoreEmbed)
  const tags = (p.tags as string[]) ?? []
  const categoryId = normalizeCat(p.category)
  const stockCount = typeof p.stock === "number" ? p.stock : 0
  const dbImages = (p.images as string[] | null) ?? []
  const allImages =
    dbImages.length > 0 ? dbImages : p.image_url ? [p.image_url] : ["/placeholder.svg"]
  return {
    id: p.id,
    name: p.name,
    slug: p.id,
    description: p.description ?? "",
    price: Number(p.price),
    originalPrice: p.compare_price ? Number(p.compare_price) : undefined,
    categoryId,
    images: allImages,
    tags,
    vendorId: p.store_id,
    vendorName: store?.name ?? "",
    inStock: stockCount > 0,
    stockCount,
    stock: stockCount,
    featured: false,
    rating: 0,
    reviewCount: 0,
    createdAt: p.created_at,
    searchAliases: buildSearchAliases(categoryId, tags),
  }
}
