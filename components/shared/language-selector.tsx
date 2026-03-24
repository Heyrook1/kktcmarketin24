"use client"

import { useState, useEffect, useRef } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const LANGUAGES = [
  { code: "TR", label: "Türkçe",   sublabel: "Türkçe",    gtCode: null  },
  { code: "EN", label: "English",  sublabel: "İngilizce", gtCode: "en"  },
  { code: "CY", label: "Ελληνικά", sublabel: "Yunanca",   gtCode: "el"  },
] as const

type LangCode = (typeof LANGUAGES)[number]["code"]

function setGTCookie(value: string) {
  const hostname = window.location.hostname
  document.cookie = `googtrans=${value}; path=/`
  document.cookie = `googtrans=${value}; path=/; domain=${hostname}`
  if (hostname.includes(".")) {
    const root = hostname.split(".").slice(-2).join(".")
    document.cookie = `googtrans=${value}; path=/; domain=.${root}`
  }
}

function waitAndChange(gtCode: string, attempt = 0) {
  const sel = document.querySelector<HTMLSelectElement>(".goog-te-combo")
  if (sel) {
    sel.value = gtCode
    sel.dispatchEvent(new Event("change"))
  } else if (attempt < 25) {
    setTimeout(() => waitAndChange(gtCode, attempt + 1), 120)
  } else {
    window.location.reload()
  }
}

function applyLanguage(gtCode: string | null) {
  if (!gtCode) {
    setGTCookie("/auto/tr")
    const sel = document.querySelector<HTMLSelectElement>(".goog-te-combo")
    if (sel) { sel.value = "tr"; sel.dispatchEvent(new Event("change")) }
    else window.location.reload()
    return
  }
  setGTCookie(`/tr/${gtCode}`)
  waitAndChange(gtCode)
}

function getActiveLang(): LangCode {
  if (typeof document === "undefined") return "TR"
  const m = document.cookie.match(/googtrans=\/(?:tr|auto)\/([a-z-]+)/)
  if (!m || m[1] === "tr") return "TR"
  return LANGUAGES.find((l) => l.gtCode === m[1])?.code ?? "TR"
}

export function LanguageSelector() {
  const [current, setCurrent] = useState<LangCode>("TR")
  const [open, setOpen]       = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setCurrent(getActiveLang()) }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0]

  function select(lang: (typeof LANGUAGES)[number]) {
    setOpen(false)
    if (lang.code === current) return
    setCurrent(lang.code)
    applyLanguage(lang.gtCode)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger — only code + chevron, no flag or duplicate text */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Dil: ${active.label}`}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold tracking-widest text-foreground hover:bg-secondary/60 transition-colors"
      >
        {active.code}
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Dil Seç"
          className={cn(
            "absolute right-0 top-full mt-2 w-56 z-[200]",
            "rounded-2xl border border-border bg-background shadow-2xl overflow-hidden",
          )}
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === current
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => select(lang)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors group",
                  isActive
                    ? "bg-primary/5 text-primary"
                    : "text-foreground hover:bg-secondary/60"
                )}
              >
                {/* Code badge */}
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-8 shrink-0",
                    "rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-widest",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground group-hover:bg-border/70"
                  )}
                >
                  {lang.code}
                </span>

                {/* Language name */}
                <span className={cn("flex-1 text-left font-medium leading-tight", isActive && "text-primary")}>
                  {lang.label}
                </span>

                {/* Sublabel */}
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-normal">
                  {lang.sublabel}
                </span>

                {/* Active check */}
                {isActive && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
