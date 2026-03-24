"use client"

import { useState, useEffect, useRef } from "react"
import { Globe, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    google?: { translate: { TranslateElement: unknown } }
  }
}

const LANGUAGES = [
  { code: "tr", label: "Türkçe",   flag: "🇹🇷", gtCode: null  },
  { code: "en", label: "English",  flag: "🇬🇧", gtCode: "en"  },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷", gtCode: "el"  },
] as const

type LangCode = (typeof LANGUAGES)[number]["code"]

function triggerGoogleTranslate(gtCode: string | null) {
  if (typeof document === "undefined") return

  if (!gtCode) {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
    window.location.reload()
    return
  }

  const val = `/tr/${gtCode}`
  document.cookie = `googtrans=${val}; path=/`
  document.cookie = `googtrans=${val}; path=/; domain=${window.location.hostname}`

  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo")
  if (select) {
    select.value = gtCode
    select.dispatchEvent(new Event("change"))
  } else {
    window.location.reload()
  }
}

function detectCurrentLang(): LangCode {
  if (typeof document === "undefined") return "tr"
  const match = document.cookie.match(/googtrans=\/tr\/([a-z]+)/)
  if (!match) return "tr"
  const found = LANGUAGES.find((l) => l.gtCode === match[1])
  return found ? found.code : "tr"
}

export function LanguageSelector() {
  const [current, setCurrent] = useState<LangCode>("tr")
  const [open, setOpen]       = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setCurrent(detectCurrentLang()) }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const activeLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0]

  function handleSelect(lang: (typeof LANGUAGES)[number]) {
    setOpen(false)
    if (lang.code === current) return
    setCurrent(lang.code)
    triggerGoogleTranslate(lang.gtCode)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Dil seç: ${activeLang.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
      >
        <Globe className="h-3.5 w-3.5" />
        <span aria-hidden="true">{activeLang.flag}</span>
        <span className="font-semibold text-foreground">{activeLang.code.toUpperCase()}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-150", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Dil Seç"
          className="absolute right-0 top-full mt-1 w-40 rounded-xl border bg-background shadow-xl py-1 z-[60]"
          style={{ animation: "fadeIn .12s ease-out both" }}
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === current
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(lang)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                  isActive ? "bg-primary/5 text-primary font-medium" : "text-foreground hover:bg-secondary"
                )}
              >
                <span className="text-base leading-none" aria-hidden="true">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.label}</span>
                {isActive && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

