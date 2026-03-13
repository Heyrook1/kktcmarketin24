import { create } from "zustand"
import { persist } from "zustand/middleware"
import { translations, type LangCode } from "@/lib/translations"
import type { Translations } from "@/lib/translations"

interface LanguageState {
  lang: LangCode
  setLang: (lang: LangCode) => void
  t: Translations
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: "tr",
      t: translations["tr"],
      setLang: (lang: LangCode) => {
        set({ lang, t: translations[lang] })
        // Update <html dir> and <html lang> for RTL (Arabic) support
        if (typeof document !== "undefined") {
          document.documentElement.lang = lang
          document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
        }
      },
    }),
    {
      name: "marketin24-language",
      // Rehydrate t from persisted lang on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.lang] ?? translations["tr"]
          if (typeof document !== "undefined") {
            document.documentElement.lang = state.lang
            document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr"
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
