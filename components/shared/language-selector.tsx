"use client"

import { Globe, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguageStore } from "@/lib/store/language-store"
import type { LangCode } from "@/lib/translations"
import { cn } from "@/lib/utils"

const LANGUAGES: { code: LangCode; name: string; native: string }[] = [
  { code: "tr", name: "Turkish",  native: "Türkçe"   },
  { code: "en", name: "English",  native: "English"   },
  { code: "de", name: "German",   native: "Deutsch"   },
  { code: "fr", name: "French",   native: "Français"  },
  { code: "es", name: "Spanish",  native: "Español"   },
  { code: "ar", name: "Arabic",   native: "العربية"   },
]

const FLAG: Record<LangCode, string> = {
  tr: "TR", en: "GB", de: "DE", fr: "FR", es: "ES", ar: "SA",
}

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
          {FLAG[lang]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={cn(
              "flex items-center justify-between gap-3 text-sm",
              l.code === lang && "font-semibold text-primary"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground w-5">
                {FLAG[l.code]}
              </span>
              {l.native}
            </span>
            {l.code === lang && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
