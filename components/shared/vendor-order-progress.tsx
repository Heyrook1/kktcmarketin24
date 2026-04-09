"use client"

import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  VENDOR_STATUS_STEPS,
  VENDOR_STATUS_LABELS,
  normalizeVendorOrderStatus,
} from "@/lib/order-status/vendor-status"

export function VendorOrderProgress({
  status,
  compact = false,
}: {
  status: string
  compact?: boolean
}) {
  const normalized = normalizeVendorOrderStatus(status)
  const progressStep = Math.max(0, VENDOR_STATUS_STEPS.indexOf(normalized))

  if (normalized === "cancelled") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
        Siparis iptal edildi
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-0", compact ? "max-w-[320px]" : "w-full")}>
      {VENDOR_STATUS_STEPS.slice(0, 4).map((step, index) => {
        const done = index <= progressStep
        const active = index === progressStep
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center border-2 text-[10px] font-bold transition-all",
                  done ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground",
                  active && "ring-2 ring-primary/25 ring-offset-1",
                )}
              >
                {done ? <CheckCircle className="h-3.5 w-3.5" /> : <span>{index + 1}</span>}
              </div>
              {!compact && (
                <span className={cn("text-[10px] whitespace-nowrap", done ? "text-primary" : "text-muted-foreground")}>
                  {VENDOR_STATUS_LABELS[step]}
                </span>
              )}
            </div>
            {index < 3 && (
              <div className={cn("h-0.5 flex-1 mx-1 rounded", index < progressStep ? "bg-primary" : "bg-border")} />
            )}
          </div>
        )
      })}
    </div>
  )
}
