"use client"

import { Globe, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguageStore } from "@/lib/store/language-store"
import type { LangCode } from "@/lib/translations"
import { cn } from "@/lib/utils"

interface LangOption {
  code: LangCode
  native: string
  flag: string
  dir?: "rtl"
}

const LANGUAGES: LangOption[] = [
  { code: "tr", native: "Türkçe",   flag: "🇹🇷" },
  { code: "en", native: "English",  flag: "🇬🇧" },
  { code: "ru", native: "Русский",  flag: "🇷🇺" },
  { code: "he", native: "עברית",    flag: "🇮🇱", dir: "rtl" },
  { code: "ar", native: "العربية",  flag: "🇸🇦", dir: "rtl" },
  { code: "de", native: "Deutsch",  flag: "🇩🇪" },
  { code: "fr", native: "Français", flag: "🇫🇷" },
  { code: "es", native: "Español",  flag: "🇪🇸" },
]

export function LanguageSelector() {
  const { lang, setLang } = useLanguageStore()
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 font-semibold text-xs tracking-wide rounded-md border border-border hover:border-primary/40"
          aria-label="Select language"
        >
          <Globe className="h-3.5 w-3.5 flex-shrink-0" />
          <span aria-hidden="true">{current.flag}</span>
          <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[175px] p-1">
        {/* Top 4 featured languages */}
        {LANGUAGES.slice(0, 4).map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            dir={l.dir}
            className={cn(
              "flex items-center justify-between gap-3 text-sm rounded-md px-2 py-1.5",
              l.code === lang && "font-semibold text-primary bg-primary/5"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none" aria-hidden="true">{l.flag}</span>
              {l.native}
            </span>
            {l.code === lang && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Remaining languages */}
        {LANGUAGES.slice(4).map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={cn(
              "flex items-center justify-between gap-3 text-sm rounded-md px-2 py-1.5",
              l.code === lang && "font-semibold text-primary bg-primary/5"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none" aria-hidden="true">{l.flag}</span>
              {l.native}
            </span>
            {l.code === lang && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
