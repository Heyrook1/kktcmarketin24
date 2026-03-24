"use client"

import { useState, useEffect, useRef } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const LANGUAGES = [
  { code: "tr", label: "Türkçe",   flag: "🇹🇷", gtCode: null  },
  { code: "en", label: "English",  flag: "🇬🇧", gtCode: "en"  },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷", gtCode: "el"  },
] as const

type LangCode = (typeof LANGUAGES)[number]["code"]

// ─── Google Translate helpers ────────────────────────────────────────────────

function setCookieForDomain(name: string, value: string) {
  const host = window.location.hostname
  document.cookie = `${name}=${value}; path=/`
  document.cookie = `${name}=${value}; path=/; domain=${host}`
  if (host.split(".").length > 1) {
    const rootDomain = host.split(".").slice(-2).join(".")
    document.cookie = `${name}=${value}; path=/; domain=.${rootDomain}`
  }
}

function waitForSelectAndChange(gtCode: string, attempts = 0) {
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo")
  if (select) {
    select.value = gtCode
    select.dispatchEvent(new Event("change"))
    return
  }
  if (attempts < 20) setTimeout(() => waitForSelectAndChange(gtCode, attempts + 1), 150)
  else window.location.reload()
}

function triggerTranslation(gtCode: string | null) {
  if (!gtCode) {
    // Restore to original Turkish
    setCookieForDomain("googtrans", "/auto/tr")
    // Try the combo box first
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo")
    if (select) {
      select.value = "tr"
      select.dispatchEvent(new Event("change"))
    } else {
      window.location.reload()
    }
    return
  }
  setCookieForDomain("googtrans", `/tr/${gtCode}`)
  waitForSelectAndChange(gtCode)
}

function detectCurrentLang(): LangCode {
  if (typeof document === "undefined") return "tr"
  const m = document.cookie.match(/googtrans=\/(?:tr|auto)\/([a-z-]+)/)
  if (!m || m[1] === "tr") return "tr"
  const found = LANGUAGES.find((l) => l.gtCode === m[1])
  return found?.code ?? "tr"
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LanguageSelector() {
  const [current, setCurrent] = useState<LangCode>("tr")
  const [open, setOpen]       = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrent(detectCurrentLang())
  }, [])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onOutside)
    return () => document.removeEventListener("mousedown", onOutside)
  }, [])

  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0]

  function handleSelect(lang: (typeof LANGUAGES)[number]) {
    setOpen(false)
    if (lang.code === current) return
    setCurrent(lang.code)
    triggerTranslation(lang.gtCode)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button — shows FLAG + CODE only (no redundant globe text) */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Dil: ${active.label}. Değiştir`}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-secondary/60 transition-colors"
      >
        <span className="text-sm leading-none" aria-hidden="true">{active.flag}</span>
        <span className="text-foreground tracking-wide">{active.code.toUpperCase()}</span>
        <ChevronDown className={cn(
          "h-3 w-3 text-muted-foreground transition-transform duration-150",
          open && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Dil seçin"
          className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-background shadow-2xl py-1.5 z-[200]"
          style={{ animation: "fadeIn .1s ease-out both" }}
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
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/8 text-primary font-semibold"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <span className="text-base leading-none w-5 text-center" aria-hidden="true">
                  {lang.flag}
                </span>
                <span className="flex-1 text-left">{lang.label}</span>
                <span className="text-[11px] font-bold text-muted-foreground/60 tracking-wider">
                  {lang.code.toUpperCase()}
                </span>
                {isActive && (
                  <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                )}
              </button>
            )
          })}

          <div className="mx-3 mt-1.5 pt-1.5 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground/60 leading-snug">
              Google Translate ile çevrilir
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

