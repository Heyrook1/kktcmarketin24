type VendorStoreLike =
  | {
      name?: string | null
      slug?: string | null
    }
  | null
  | undefined

type ProductLike = {
  name?: string | null
  tags?: unknown
  stock?: number | null
  stockCount?: number | null
  vendorName?: string | null
  vendor_stores?: unknown
}

function hasDemoText(value: string | null | undefined) {
  return value?.toLocaleLowerCase("tr-TR").includes("demo") ?? false
}

function getTags(tags: unknown): string[] {
  return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string") : []
}

function getVendorStores(product: ProductLike): VendorStoreLike[] {
  if (!product.vendor_stores) return []
  const stores = Array.isArray(product.vendor_stores) ? product.vendor_stores : [product.vendor_stores]
  return stores.filter((store): store is Exclude<VendorStoreLike, null | undefined> => {
    if (!store || typeof store !== "object") return false
    return "name" in store || "slug" in store
  })
}

export function isDemoProduct(product: ProductLike) {
  if (hasDemoText(product.name) || hasDemoText(product.vendorName)) return true

  const tags = getTags(product.tags)
  if (tags.some((tag) => hasDemoText(tag))) return true

  return getVendorStores(product).some((store) => hasDemoText(store?.name) || hasDemoText(store?.slug))
}

export function isInStockProduct(product: ProductLike) {
  const stock = typeof product.stock === "number" ? product.stock : product.stockCount
  return typeof stock === "number" ? stock > 0 : false
}

export function isPublicProduct(product: ProductLike) {
  return !isDemoProduct(product)
}

export function isPublicInStockProduct(product: ProductLike) {
  return isPublicProduct(product) && isInStockProduct(product)
}
