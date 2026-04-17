const DEMO_MARKERS = ["demo", "sample", "test", "dummy", "ornek", "örnek"] as const

type PublicCatalogProductCandidate = {
  stock: number | null
  tags: unknown
  name?: string | null
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.toLowerCase())
}

function hasDemoMarker(candidate: PublicCatalogProductCandidate): boolean {
  const normalizedName = (candidate.name ?? "").toLowerCase()
  const normalizedTags = normalizeTags(candidate.tags)

  if (normalizedTags.some((tag) => DEMO_MARKERS.some((marker) => tag.includes(marker)))) {
    return true
  }

  return DEMO_MARKERS.some((marker) => normalizedName.includes(marker))
}

export function isPublicCatalogProduct(candidate: PublicCatalogProductCandidate): boolean {
  if (typeof candidate.stock !== "number" || candidate.stock <= 0) {
    return false
  }

  if (hasDemoMarker(candidate)) {
    return false
  }

  return true
}
