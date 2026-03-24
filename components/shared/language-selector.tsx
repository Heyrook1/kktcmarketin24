"use client"

import { useState, useEffect, useRef } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Inline SVG flag icons (no external dependency) ───────────────────────────

function FlagTR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="12.5" cy="10" r="5.5" fill="#fff" />
      <circle cx="14" cy="10" r="4.2" fill="#E30A17" />
      <polygon fill="#fff" points="18.5,10 21.5,8 20.8,11.5 23.5,13.5 20,13 18.5,16.5 17,13 13.5,13.5 16.2,11.5 15.5,8" />
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
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#fff" />
      {/* Copper-colored island silhouette */}
      <path
        d="M8,7 Q10,5 14,6 Q18,5 22,7 Q22,10 20,11 Q18,13 14,13 Q10,13 8,11 Z"
        fill="#F9A825"
      />
      {/* Olive branches */}
      <path d="M10,14 Q14,12 18,14" stroke="#4CAF50" strokeWidth="1" fill="none" />
      <path d="M11,14.5 Q14,13 17,14.5" stroke="#4CAF50" strokeWidth="0.8" fill="none" />
    </svg>
  )
}

const FLAGS: Record<string, (p: { className?: string }) => JSX.Element> = {
  TR: FlagTR,
  EN: FlagEN,
  CY: FlagCY,
}

// ─── Language list ─────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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
  const ActiveFlag = FLAGS[active.code]

  function select(lang: (typeof LANGUAGES)[number]) {
    setOpen(false)
    if (lang.code === current) return
    setCurrent(lang.code)
    applyLanguage(lang.gtCode)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger: flag + code + chevron */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Dil: ${active.label}`}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-secondary/60 transition-colors"
      >
        <span className="overflow-hidden rounded-sm shadow-sm" style={{ width: 20, height: 14 }}>
          <ActiveFlag className="w-full h-full object-cover" />
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
            "absolute right-0 top-full mt-2 w-52 z-[200]",
            "rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
          )}
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === current
            const FlagIcon = FLAGS[lang.code]
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
                {/* Flag */}
                <span
                  className="overflow-hidden rounded-sm shadow-sm shrink-0"
                  style={{ width: 24, height: 16 }}
                >
                  <FlagIcon className="w-full h-full" />
                </span>

                {/* Language name */}
                <span className={cn("flex-1 text-left font-medium", isActive && "text-primary")}>
                  {lang.label}
                </span>

                {/* Sublabel */}
                <span className="text-[10px] tracking-wider text-muted-foreground/50 font-normal">
                  {lang.sublabel}
                </span>

                {/* Active check */}
                {isActive && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-1" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


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
