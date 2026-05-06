import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const ROW1 = [
  {
    badge:    "Bu Hafta",
    title:    "Elektronik Festivali",
    sub:      "Telefon, tablet, kulaklık ve daha fazlası",
    gradient: "from-blue-700/90 via-indigo-600/80 to-transparent",
    href:     "/urunler?category=electronics",
    img:      "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=320&fit=crop",
    wide:     true,
  },
  {
    badge:    "Yeni Sezon",
    title:    "Moda & Stil",
    sub:      "Kadın, erkek ve çocuk giyim",
    gradient: "from-rose-600/90 via-pink-500/80 to-transparent",
    href:     "/urunler?category=fashion",
    img:      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&h=320&fit=crop",
    wide:     false,
  },
]

const ROW2 = [
  {
    badge:    "Fırsat",
    title:    "Spor & Outdoor",
    sub:      "Fitness ekipmanları",
    gradient: "from-green-700/90 to-emerald-500/80",
    href:     "/urunler?category=sports",
    img:      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=450&h=220&fit=crop",
  },
  {
    badge:    "İndirim",
    title:    "Güzellik & Bakım",
    sub:      "Doğal & organik ürünler",
    gradient: "from-purple-700/90 to-violet-500/80",
    href:     "/urunler?category=beauty",
    img:      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=450&h=220&fit=crop",
  },
  {
    badge:    "Kampanya",
    title:    "Ev & Bahçe",
    sub:      "Dekorasyon ve mobilya",
    gradient: "from-amber-600/90 to-orange-500/80",
    href:     "/urunler?category=home-garden",
    img:      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=450&h=220&fit=crop",
  },
]

interface BannerItem {
  badge: string
  title: string
  sub: string
  gradient: string
  href: string
  img: string
  wide?: boolean
}

function BannerCard({ item, height = "h-40" }: { item: BannerItem; height?: string }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative overflow-hidden rounded-2xl block",
        height,
      )}
    >
      <Image
        src={item.img}
        alt={item.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div className={cn("absolute inset-0 bg-gradient-to-r", item.gradient)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col justify-end h-full p-4 md:p-5">
        <span className="inline-block self-start text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1.5 border border-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm bg-white/10">
          {item.badge}
        </span>
        <h3 className="text-white font-black text-lg md:text-xl leading-tight drop-shadow">{item.title}</h3>
        <p className="text-white/70 text-xs mt-0.5">{item.sub}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:gap-3 transition-all duration-200">
          Keşfet <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}

export function CampaignBanners() {
  return (
    <section className="py-8 border-b">
      <div className="container mx-auto px-4 space-y-3">

        {/* Row 1: 2 columns (2:1 ratio) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <BannerCard item={ROW1[0]} height="h-44 md:h-52" />
          </div>
          <div>
            <BannerCard item={ROW1[1]} height="h-44 md:h-52" />
          </div>
        </div>

        {/* Row 2: 3 equal columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROW2.map((item) => (
            <BannerCard key={item.href} item={item} height="h-36 sm:h-40" />
          ))}
        </div>

      </div>
    </section>
  )
}
