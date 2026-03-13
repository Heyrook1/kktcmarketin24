"use client"

/**
 * GoogleTranslateSync
 *
 * Watches the Zustand language store and calls the Google Translate widget's
 * internal `doGTranslate()` function whenever the language changes.
 * This component renders nothing — it is purely a side-effect bridge.
 *
 * Google Translate's `doGTranslate` signature: doGTranslate("tr|<target>")
 * When the target is "tr" (source language), we call "tr|tr" which resets
 * the page back to the original Turkish source text.
 */

import { useEffect, useRef } from "react"
import { useLanguageStore, GT_LANG_MAP } from "@/lib/store/language-store"

declare global {
  interface Window {
    doGTranslate?: (lang: string) => void
    google?: {
      translate?: {
        TranslateElement?: unknown
      }
    }
  }
}

export function GoogleTranslateSync() {
  const { lang, gtLang } = useLanguageStore()
  const prevLang = useRef<string>("tr")

  useEffect(() => {
    const target = gtLang
    const prev = prevLang.current

    if (target === prev) return
    prevLang.current = target

    // If reverting to Turkish (source language), we need to restore original
    if (target === "tr") {
      // Remove the Google Translate cookie to restore source language
      const resetTranslate = () => {
        // Remove the googtrans cookie
        document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "googtrans=; path=/; domain=" + window.location.hostname + "; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        // Find and reset the GT select element
        const select = document.querySelector<HTMLSelectElement>(".goog-te-combo")
        if (select) {
          select.value = "tr"
          select.dispatchEvent(new Event("change"))
        }
        // Also try doGTranslate
        if (typeof window.doGTranslate === "function") {
          window.doGTranslate("tr|tr")
        }
      }
      // Delay slightly to ensure GT has initialised
      const id = setTimeout(resetTranslate, 300)
      return () => clearTimeout(id)
    }

    // For non-Turkish languages, wait for the GT widget to be ready then trigger
    const attempt = (retries = 0) => {
      if (typeof window.doGTranslate === "function") {
        window.doGTranslate(`tr|${target}`)
      } else if (retries < 20) {
        // GT script not yet initialised — retry every 250ms (max 5 s)
        setTimeout(() => attempt(retries + 1), 250)
      }
    }
    attempt()
  }, [gtLang, lang])

  // Hide the ugly default Google Translate toolbar with CSS injected once
  useEffect(() => {
    const style = document.createElement("style")
    style.id = "gt-hide-bar"
    style.textContent = `
      /* Hide the Google Translate top bar completely */
      .goog-te-banner-frame, .skiptranslate { display: none !important; }
      body { top: 0 !important; }
      /* Keep font rendering clean during translation */
      .goog-text-highlight { background: none !important; box-shadow: none !important; }
    `
    if (!document.getElementById("gt-hide-bar")) {
      document.head.appendChild(style)
    }
  }, [])

  return null
}
