export type PublicProductVisibilityRow = {
  name?: string | null
  stock?: number | null
  tags?: unknown
}

function normaliseTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []

  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
}

export function isPubliclyVisibleProduct(row: PublicProductVisibilityRow) {
  const stockCount = typeof row.stock === "number" ? row.stock : 0
  if (stockCount <= 0) return false

  const productName = row.name?.trim().toLowerCase() ?? ""
  if (productName.includes("demo")) return false

  const tags = normaliseTags(row.tags)
  return !tags.includes("demo")
}

export function filterPubliclyVisibleProducts<T extends PublicProductVisibilityRow>(rows: T[]) {
  return rows.filter(isPubliclyVisibleProduct)
}

export function applyPublicProductFilters<QueryBuilder extends {
  gt: (column: string, value: number) => QueryBuilder
  not: (column: string, operator: string, value: string) => QueryBuilder
}>(query: QueryBuilder) {
  return query.gt("stock", 0).not("tags", "cs", `{"demo"}`)
}
