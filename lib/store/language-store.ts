"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { translations, type LangCode } from "@/lib/translations"
import type { Translations } from "@/lib/translations"

// Maps our LangCode to the code Google Translate expects
export const GT_LANG_MAP: Record<LangCode, string> = {
  tr: "tr",
  en: "en",
  de: "de",
  fr: "fr",
  es: "es",
  ar: "ar",
  ru: "ru",
  he: "iw", // Google Translate uses "iw" for Hebrew
}

// Languages that are RTL
const RTL_LANGS: LangCode[] = ["ar", "he"]

interface LanguageState {
  lang: LangCode
  gtLang: string
  setLang: (lang: LangCode) => void
  t: Translations
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: "tr",
      gtLang: "tr",
      t: translations["tr"],
      setLang: (lang: LangCode) => {
        const gtLang = GT_LANG_MAP[lang]
        set({ lang, gtLang, t: translations[lang] })
        if (typeof document !== "undefined") {
          document.documentElement.lang = lang === "he" ? "he" : lang
          document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr"
        }
      },
    }),
    {
      name: "marketin24-language",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.lang] ?? translations["tr"]
          state.gtLang = GT_LANG_MAP[state.lang] ?? "tr"
          if (typeof document !== "undefined") {
            document.documentElement.lang = state.lang === "he" ? "he" : state.lang
            document.documentElement.dir = RTL_LANGS.includes(state.lang) ? "rtl" : "ltr"
          }
        }
      },
    }
  )
)

/** Convenience hook — returns just the translation object */
export function useT() {
  return useLanguageStore((s) => s.t)
}
