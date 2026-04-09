export const CANONICAL_VENDOR_ORDER_STATUSES = [
  "confirmed",
  "shipped",
  "exchange_requested",
  "delivered",
  "cancelled",
] as const

export type CanonicalVendorOrderStatus = (typeof CANONICAL_VENDOR_ORDER_STATUSES)[number]

const LEGACY_TO_CANONICAL: Record<string, CanonicalVendorOrderStatus> = {
  pending: "confirmed",
  preparing: "confirmed",
  refunded: "exchange_requested",
}

export const VENDOR_STATUS_LABELS: Record<CanonicalVendorOrderStatus, string> = {
  confirmed: "Siparis onaylandi",
  shipped: "Siparis kargoda",
  exchange_requested: "Degisim / iade edildi",
  delivered: "Musteriye teslim edildi",
  cancelled: "Siparis iptal edildi",
}

export const VENDOR_STATUS_COLORS: Record<CanonicalVendorOrderStatus, string> = {
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  exchange_requested: "bg-orange-100 text-orange-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
}

export const VENDOR_STATUS_STEPS: CanonicalVendorOrderStatus[] = [
  "confirmed",
  "shipped",
  "exchange_requested",
  "delivered",
  "cancelled",
]

export const VENDOR_ORDER_TRANSITIONS: Record<CanonicalVendorOrderStatus, CanonicalVendorOrderStatus[]> = {
  confirmed: ["shipped", "exchange_requested", "delivered", "cancelled"],
  shipped: ["exchange_requested", "delivered", "cancelled"],
  exchange_requested: ["shipped", "delivered", "cancelled"],
  delivered: [],
  cancelled: [],
}

export function normalizeVendorOrderStatus(status: string | null | undefined): CanonicalVendorOrderStatus {
  if (!status) return "confirmed"
  if ((CANONICAL_VENDOR_ORDER_STATUSES as readonly string[]).includes(status)) {
    return status as CanonicalVendorOrderStatus
  }
  return LEGACY_TO_CANONICAL[status] ?? "confirmed"
}

export function getAllowedNextVendorStatuses(
  currentStatus: string | null | undefined,
): CanonicalVendorOrderStatus[] {
  return VENDOR_ORDER_TRANSITIONS[normalizeVendorOrderStatus(currentStatus)] ?? []
}

export function deriveCanonicalVendorOrderStatus(rows: Array<{ status: string }>): CanonicalVendorOrderStatus {
  if (rows.length === 0) return "confirmed"
  const normalized = rows.map((row) => normalizeVendorOrderStatus(row.status))
  if (normalized.some((status) => status === "cancelled")) return "cancelled"
  if (normalized.every((status) => status === "delivered")) return "delivered"
  if (normalized.some((status) => status === "exchange_requested")) return "exchange_requested"
  if (normalized.some((status) => status === "shipped")) return "shipped"
  return "confirmed"
}
