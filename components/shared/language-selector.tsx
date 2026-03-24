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
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {/* White background */}
      <rect width="60" height="40" fill="#FFFFFF" />

      {/* Cyprus island — copper/orange silhouette, accurate outline */}
      <path
        d="M11,17
           C12,14 15,12 19,11
           C22,10 25,10 27,11
           C28,10 30,9.5 32,10
           C35,9 38,9.5 41,11
           C44,12 47,13 48,15
           C49,17 48,19 46,21
           C44,23 41,25 37,26
           C34,27 31,27.5 28,27
           C25,27.5 22,27 19,26
           C16,25 13,23 11.5,21
           C10,19 10,18 11,17 Z"
        fill="#D27A22"
      />
      {/* Shadow/depth on island */}
      <path
        d="M28,27 C31,27.5 34,27 37,26 C41,25 44,23 46,21 C47,19.5 47,18 46,16.5"
        fill="none"
        stroke="#B5621A"
        strokeWidth="0.6"
        opacity="0.5"
      />

      {/* Olive branch LEFT — stem curving down-left */}
      <path
        d="M18,30 Q21,28 24,30 Q27,28 30,29"
        fill="none"
        stroke="#4A7C3F"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Olive branch RIGHT — stem curving down-right */}
      <path
        d="M42,30 Q39,28 36,30 Q33,28 30,29"
        fill="none"
        stroke="#4A7C3F"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Left branch leaves */}
      <ellipse cx="19.5" cy="29.5" rx="1.8" ry="0.9" transform="rotate(-30 19.5 29.5)" fill="#4A7C3F" />
      <ellipse cx="22"   cy="28.3" rx="1.8" ry="0.9" transform="rotate(-15 22 28.3)"   fill="#5A9C4F" />
      <ellipse cx="25"   cy="29.2" rx="1.8" ry="0.9" transform="rotate(10 25 29.2)"    fill="#4A7C3F" />
      <ellipse cx="27.5" cy="28"   rx="1.8" ry="0.9" transform="rotate(20 27.5 28)"    fill="#5A9C4F" />

      {/* Right branch leaves */}
      <ellipse cx="40.5" cy="29.5" rx="1.8" ry="0.9" transform="rotate(30 40.5 29.5)"  fill="#4A7C3F" />
      <ellipse cx="38"   cy="28.3" rx="1.8" ry="0.9" transform="rotate(15 38 28.3)"    fill="#5A9C4F" />
      <ellipse cx="35"   cy="29.2" rx="1.8" ry="0.9" transform="rotate(-10 35 29.2)"   fill="#4A7C3F" />
      <ellipse cx="32.5" cy="28"   rx="1.8" ry="0.9" transform="rotate(-20 32.5 28)"   fill="#5A9C4F" />

      {/* Berries at tips */}
      <circle cx="18"   cy="30.2" r="0.9" fill="#4A7C3F" />
      <circle cx="42"   cy="30.2" r="0.9" fill="#4A7C3F" />
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
