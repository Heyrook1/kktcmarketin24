export function extractRoleName(value: unknown): string | null {
  if (!value) return null
  if (Array.isArray(value)) {
    const first = value[0] as { name?: unknown } | undefined
    return typeof first?.name === "string" ? first.name.toLowerCase() : null
  }
  if (typeof value === "object") {
    const role = value as { name?: unknown }
    return typeof role.name === "string" ? role.name.toLowerCase() : null
  }
  return null
}
