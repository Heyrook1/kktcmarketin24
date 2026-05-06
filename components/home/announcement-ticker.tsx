"use client"

import { Zap, Truck, Gift, Tag, Star, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS = [
  { icon: Zap,    color: "text-yellow-300", text: "Flaş İndirim — Elektronikte -%30"       },
  { icon: Truck,  color: "text-green-500",  text: "500 ₺ Üzeri Siparişlerde Ücretsiz Kargo" },
  { icon: Gift,   color: "text-pink-500",   text: "Yeni Üyelere Özel %10 Hediye Çeki"       },
  { icon: Tag,    color: "text-purple-500", text: "Kupon: KKTC10 ile %10 İndirim"           },
  { icon: Star,   color: "text-amber-500",  text: "Bu Hafta 200+ Yeni Ürün Eklendi"         },
  { icon: Shield, color: "text-blue-500",   text: "Onaylı Satıcı Güvencesi — KKTC'nin #1"  },
]

const ALL = [...ITEMS, ...ITEMS, ...ITEMS]

export function AnnouncementTicker() {
  return (
    <div className="container mx-auto px-3 md:px-4 mt-2 mb-1">
      <div className="bg-primary text-primary-foreground overflow-hidden py-2.5 relative select-none rounded-xl shadow-sm">
        {/* Edge fade left */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-primary to-transparent z-10 pointer-events-none" />
        {/* Edge fade right */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-primary to-transparent z-10 pointer-events-none" />

        <div
          className="flex items-center gap-0 whitespace-nowrap"
          style={{ animation: "ticker 40s linear infinite" }}
        >
          {ALL.map((item, i) => {
            const Icon = item.icon
            return (
              <span key={i} className="inline-flex items-center gap-2 text-[13px] font-medium flex-shrink-0 px-6">
                <Icon className={cn("h-4 w-4 flex-shrink-0", item.color)} />
                <span className="text-primary-foreground/95">{item.text}</span>
                <span className="text-primary-foreground/30 ml-4">◆</span>
              </span>
            )
          })}
        </div>

        <style>{`
          @keyframes ticker {
            from { transform: translateX(0); }
            to   { transform: translateX(-33.333%); }
          }
        `}</style>
      </div>
    </div>
  )
}
