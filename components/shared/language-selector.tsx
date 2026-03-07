"use client"

import { useEffect, useState } from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
]

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          element: string
        ) => void
      }
    }
    googleTranslateElementInit?: () => void
  }
}

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState("en")

  useEffect(() => {
    // Check if Google Translate script is already loaded
    if (document.getElementById("google-translate-script")) return

    // Initialize Google Translate
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: languages.map((l) => l.code).join(","),
            autoDisplay: false,
          },
          "google_translate_element"
        )
      }
    }

    // Load Google Translate script
    const script = document.createElement("script")
    script.id = "google-translate-script"
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup
      const scriptElement = document.getElementById("google-translate-script")
      if (scriptElement) {
        scriptElement.remove()
      }
    }
  }, [])

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode)
    // Trigger Google Translate
    const selectElement = document.querySelector(
      ".goog-te-combo"
    ) as HTMLSelectElement
    if (selectElement) {
      selectElement.value = langCode
      selectElement.dispatchEvent(new Event("change"))
    }
  }

  const currentLanguage = languages.find((l) => l.code === currentLang)

  return (
    <>
      {/* Hidden Google Translate Element */}
      <div id="google_translate_element" className="hidden" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{currentLanguage?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="gap-2"
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
