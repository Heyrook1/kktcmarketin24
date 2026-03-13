"use client"

import { useLanguageStore } from "@/lib/store/language-store"
import type { LangCode } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { X } from "lucide-react"

const LANGUAGES: {
  code: LangCode
  label: string
  flag: string
  dir?: "rtl"
}[] = [
  { code: "tr", label: "Türkçe",    flag: "🇹🇷" },
  { code: "en", label: "English",   flag: "🇬🇧" },
  { code: "ru", label: "Русский",   flag: "🇷🇺" },
  { code: "he", label: "עברית",     flag: "🇮🇱", dir: "rtl" },
  { code: "ar", label: "العربية",   flag: "🇸🇦", dir: "rtl" },
  { code: "de", label: "Deutsch",   flag: "🇩🇪" },
  { code: "fr", label: "Français",  flag: "🇫🇷" },
  { code: "es", label: "Español",   flag: "🇪🇸" },
]

export function LanguageBar() {
  const { lang, setLang } = useLanguageStore()
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user already dismissed this session
    const val = sessionStorage.getItem("langbar-dismissed")
    if (val === "1") setDismissed(true)
  }, [])

  if (!mounted || dismissed) return null

  return (
    <div
      className={cn(
        "w-full border-b bg-secondary/60 backdrop-blur-sm z-40",
        "transition-all duration-300"
      )}
      role="navigation"
      aria-label="Language selector"
    >
      <div className="container mx-auto px-4 py-1.5 flex items-center justify-between gap-2">
        {/* Language pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {LANGUAGES.map(({ code, label, flag, dir }) => {
            const isActive = lang === code
            return (
              <button
                key={code}
                onClick={() => setLang(code)}
                dir={dir}
                aria-pressed={isActive}
                aria-label={`Switch to ${label}`}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                  "transition-all duration-200 border select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <span aria-hidden="true">{flag}</span>
                <span className={cn(isActive ? "" : "hidden sm:inline")}>{label}</span>
              </button>
            )
          })}
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => {
            setDismissed(true)
            sessionStorage.setItem("langbar-dismissed", "1")
          }}
          aria-label="Dismiss language bar"
          className="ml-2 flex-shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
