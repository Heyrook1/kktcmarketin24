"use client"

import { LanguageSelector } from "@/components/shared/language-selector"
import { CurrencySelector } from "@/components/shared/currency-selector"

export function MobileLocaleBar() {
  return (
    <section className="lg:hidden border-b bg-background">
      <div className="container mx-auto px-3 md:px-4 py-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl border bg-secondary/30 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground tracking-wide">
              Dil ve Para Birimi
            </p>
            <p className="text-[10px] text-muted-foreground/80 truncate">
              Tercihini seç, fiyatlar otomatik güncellensin
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSelector />
            <CurrencySelector />
          </div>
        </div>
      </div>
    </section>
  )
}

