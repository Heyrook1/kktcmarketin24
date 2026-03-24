"use client"

import { useState, useEffect, useRef } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Inline SVG flag icons ────────────────────────────────────────────────────

function FlagTR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="12.5" cy="10" r="5.5" fill="#fff" />
      <circle cx="14" cy="10" r="4.2" fill="#E30A17" />
      <polygon
        fill="#fff"
        points="18.5,10 21.5,8.2 20.7,11.7 23.5,13.5 20,13 18.5,16.5 17,13 13.5,13.5 16.3,11.7 15.5,8.2"
      />
    </svg>
  )
}

function FlagEN({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden="true">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  )
}

function FlagCY({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true">
      <rect width="60" height="40" fill="#fff" />
      {/* Cyprus island copper silhouette */}
      <path
        d="M14,14 Q20,10 30,12 Q40,10 46,14 Q48,18 44,22 Q40,26 30,27 Q20,26 16,22 Q12,18 14,14 Z"
        fill="#E67E22"
        opacity="0.9"
      />
      {/* Olive branches below */}
      <path d="M22,30 Q30,27 38,30" stroke="#27AE60" strokeWidth="1.5" fill="none" />
      <path d="M24,32 Q30,29 36,32" stroke="#27AE60" strokeWidth="1.2" fill="none" />
      <circle cx="22" cy="30" r="1" fill="#27AE60" />
      <circle cx="38" cy="30" r="1" fill="#27AE60" />
    </svg>
  )
}

const FLAG_MAP: Record<string, (p: { className?: string }) => React.ReactElement> = {
  TR: FlagTR,
  EN: FlagEN,
  CY: FlagCY,
}

// ─── Language data ─────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "TR", label: "Türkçe",   sublabel: "TÜRKÇE",    gtCode: null  },
  { code: "EN", label: "English",  sublabel: "İNGİLİZCE", gtCode: "en"  },
  { code: "CY", label: "Ελληνικά", sublabel: "YUNANCA",   gtCode: "el"  },
] as const

type LangCode = (typeof LANGUAGES)[number]["code"]

// ─── Google Translate helpers ─────────────────────────────────────────────────

function setGTCookie(value: string) {
  const h = window.location.hostname
  document.cookie = `googtrans=${value}; path=/`
  document.cookie = `googtrans=${value}; path=/; domain=${h}`
  if (h.includes(".")) {
    document.cookie = `googtrans=${value}; path=/; domain=.${h.split(".").slice(-2).join(".")}`
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
    if (sel) {
      sel.value = "tr"
      sel.dispatchEvent(new Event("change"))
    } else {
      window.location.reload()
    }
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

// ─── Component ────────────────────────────────────────────────────────────────

export function LanguageSelector() {
  const [current, setCurrent] = useState<LangCode>("TR")
  const [open, setOpen]       = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrent(getActiveLang())
  }, [])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onOutside)
    return () => document.removeEventListener("mousedown", onOutside)
  }, [])

  const active   = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0]
  const FlagIcon = FLAG_MAP[active.code]

  function handleSelect(lang: (typeof LANGUAGES)[number]) {
    setOpen(false)
    if (lang.code === current) return
    setCurrent(lang.code)
    applyLanguage(lang.gtCode)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger: flag + code + chevron — nothing else */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Dil: ${active.label}`}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-secondary/60 transition-colors"
      >
        <span
          className="overflow-hidden rounded-[3px] shadow-sm shrink-0"
          style={{ width: 20, height: 14 }}
        >
          <FlagIcon className="w-full h-full" />
        </span>
        <span className="text-[11px] font-bold tracking-widest text-foreground leading-none">
          {active.code}
        </span>
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
            "rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
          )}
        >
          {LANGUAGES.map((lang) => {
            const isActive  = lang.code === current
            const ItemFlag  = FLAG_MAP[lang.code]
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(lang)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                  isActive
                    ? "bg-primary/5 text-primary"
                    : "text-foreground hover:bg-secondary/60"
                )}
              >
                {/* Flag */}
                <span
                  className="overflow-hidden rounded-[3px] shadow-sm shrink-0"
                  style={{ width: 26, height: 18 }}
                >
                  <ItemFlag className="w-full h-full" />
                </span>

                {/* Language name */}
                <span className={cn("flex-1 text-left font-medium text-sm", isActive && "text-primary")}>
                  {lang.label}
                </span>

                {/* Sublabel */}
                <span className="text-[10px] tracking-widest text-muted-foreground/50 font-normal">
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
