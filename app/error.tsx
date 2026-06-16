"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <h2 className="mt-6 text-2xl font-bold">Sayfa yüklenirken bir sorun oluştu</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        İstek tamamlanamadı. Lütfen tekrar deneyin; sorun devam ederse destek ekibimizle iletişime geçin.
      </p>
      <Button type="button" onClick={reset} className="mt-6 gap-2 rounded-xl">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Tekrar Dene
      </Button>
    </div>
  )
}
