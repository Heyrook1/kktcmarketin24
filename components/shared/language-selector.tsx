"use client"

import { useState, useEffect, useRef } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const LANGUAGES = [
  { code: "TR", label: "Türkçe",   sublabel: "TÜRKÇE",    flag: "/flags/tr.jpg", gtCode: null  },
  { code: "EN", label: "English",  sublabel: "İNGİLİZCE", flag: "/flags/en.jpg", gtCode: "en"  },
  { code: "CY", label: "Ελληνικά", sublabel: "YUNANCA",   flag: "/flags/cy.jpg", gtCode: "el"  },
] as const

type LangCode = (typeof LANGUAGES)[number]["code"]

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

function FlagImg({
  src,
  alt,
  width,
  height,
}: {
  src: string
  alt: string
  width: number
  height: number
}) {
  return (
    <span
      className="overflow-hidden rounded-[3px] shadow-sm shrink-0 inline-flex border border-black/10"
      style={{ width, height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full object-cover"
        loading="eager"
      />
    </span>
  )
}

export function LanguageSelector() {
  const [current, setCurrent] = useState<LangCode>("TR")
  const [open, setOpen]       = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setCurrent(getActiveLang()) }, [])

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
    applyLanguage(lang.gtCode)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Dil: ${active.label}`}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-secondary/60 transition-colors"
      >
        <FlagImg src={active.flag} alt={active.label} width={21} height={14} />
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

      {open && (
        <div
          role="listbox"
          aria-label="Dil Seç"
          className="absolute right-0 top-full mt-2 w-56 z-[200] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
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
                  "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                  isActive ? "bg-primary/5 text-primary" : "text-foreground hover:bg-secondary/60"
                )}
              >
                <FlagImg src={lang.flag} alt={lang.label} width={27} height={18} />
                <span className={cn("flex-1 text-left font-medium", isActive && "text-primary")}>
                  {lang.label}
                </span>
                <span className="text-[10px] tracking-widest text-muted-foreground/50">
                  {lang.sublabel}
                </span>
                {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
