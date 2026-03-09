"use client"

import { useRouter } from "next/navigation"
import { Store, ArrowRight } from "lucide-react"

export function SellerApplyButton() {
  const router = useRouter()

  function handleClick() {
    // Open email client with pre-filled seller application email
    const subject = encodeURIComponent("Satıcı Başvurusu – Marketin24")
    const body = encodeURIComponent(
      "Merhaba,\n\nMarketin24 platformunda satıcı olmak istiyorum. Başvurumu değerlendirmenizi rica ederim.\n\nAd Soyad:\nTelefon:\nMağaza Adı:\nSatmak İstediğim Ürün/Kategori:\n\nTeşekkürler."
    )
    window.open(`mailto:info@marketin24.com?subject=${subject}&body=${body}`, "_blank")

    // Navigate to the application page
    router.push("/seller-application")
  }

  return (
    <div
      className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6 animate-slide-in-up"
      aria-live="polite"
    >
      <button
        onClick={handleClick}
        aria-label="Satıcı olmak için başvurun"
        className="group flex items-center gap-0 overflow-hidden rounded-full shadow-lg shadow-primary/30 bg-primary text-primary-foreground transition-all duration-300 ease-out hover:gap-2 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pl-3.5 pr-3.5 py-3.5 md:pl-4 md:pr-4 md:py-3.5"
      >
        <Store className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 ease-out group-hover:max-w-[160px] md:group-hover:max-w-[180px]">
          Satıcı Ol
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" aria-hidden="true" />

        {/* Pulse ring to attract attention */}
        <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/40 animate-ping opacity-60 duration-1000" aria-hidden="true" />
      </button>
    </div>
  )
}
