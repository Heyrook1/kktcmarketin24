import type { Product } from "@/lib/data/products"

const HIDDEN_PRODUCT_TAGS = new Set(["demo", "test", "sample", "placeholder"])

export function hasHiddenProductTag(tags: readonly string[] | null | undefined): boolean {
  return (tags ?? []).some((tag) => HIDDEN_PRODUCT_TAGS.has(tag.trim().toLowerCase()))
}

export function isPubliclyVisibleProduct(
  product: Pick<Product, "inStock" | "stockCount" | "tags"> & { stock?: number | null },
): boolean {
  const stockCount =
    typeof product.stock === "number"
      ? product.stock
      : typeof product.stockCount === "number"
        ? product.stockCount
        : product.inStock
          ? 1
          : 0

  return stockCount > 0 && !hasHiddenProductTag(product.tags)
}
