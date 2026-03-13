"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { X, Download, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
  prompt(): Promise<void>
}

const DISMISSED_KEY = "marketin24-pwa-dismissed"
// Re-show after 7 days if dismissed
const DISMISSED_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return

    // Don't show if dismissed recently
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (raw) {
      const ts = parseInt(raw, 10)
      if (Date.now() - ts < DISMISSED_TTL_MS) return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Small delay so it doesn't pop immediately on first load
      setTimeout(() => setShow(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", () => {
      setInstalled(true)
      setTimeout(() => setShow(false), 2500)
    })

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setShow(false)
  }

  async function install() {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "dismissed") {
      dismiss()
    }
    setDeferredPrompt(null)
    setInstalling(false)
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-label="Uygulamayı yükle"
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm",
        "bg-card border border-border rounded-2xl shadow-2xl shadow-black/20",
        "transition-all duration-500 ease-out",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
      )}
    >
      {/* Close */}
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
        aria-label="Kapat"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="p-5">
        {installed ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-semibold text-sm">Marketin24 yüklendi!</p>
            <p className="text-xs text-muted-foreground">Ana ekranınızdan erişebilirsiniz.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4 mb-4">
              <div className="h-14 w-14 rounded-2xl overflow-hidden border flex-shrink-0 bg-primary/5 flex items-center justify-center">
                <Image
                  src="/images/marketin24-logo.png"
                  alt="Marketin24"
                  width={48}
                  height={48}
                  className="object-contain"
                  onError={(e) => {
                    // fallback to icon if logo missing
                    e.currentTarget.style.display = "none"
                  }}
                />
                <Smartphone className="h-7 w-7 text-primary hidden" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">Marketin24'ü Yükle</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Ana ekrana ekleyin, internet olmadan da gezinin ve anlık bildirimler alın.
                </p>
              </div>
            </div>

            {/* Perks row */}
            <div className="flex gap-3 mb-4">
              {[
                { icon: "⚡", text: "Daha hızlı" },
                { icon: "📦", text: "Bildirimler" },
                { icon: "🔒", text: "Güvenli" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex-1 flex flex-col items-center gap-1 rounded-xl bg-secondary py-2 px-1">
                  <span className="text-base leading-none">{icon}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full gap-2"
              onClick={install}
              disabled={installing}
            >
              <Download className="h-4 w-4" />
              {installing ? "Yükleniyor..." : "Ana Ekrana Ekle"}
            </Button>
            <button
              onClick={dismiss}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-2.5 transition-colors"
            >
              Şimdi değil
            </button>
          </>
        )}
      </div>
    </div>
  )
}
