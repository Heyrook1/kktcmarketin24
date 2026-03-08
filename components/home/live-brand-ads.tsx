"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Zap, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { brandAds, getFeaturedAds } from "@/lib/data/brand-ads"

export function LiveBrandAds() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const ads = getFeaturedAds()

  // Auto-rotate ads
  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, ads.length])

  // Simulate live updates — initialised on client only to avoid hydration mismatch
  useEffect(() => {
    setLastUpdate(new Date())
    const updateInterval = setInterval(() => {
      setLastUpdate(new Date())
    }, 30000)
    return () => clearInterval(updateInterval)
  }, [])

  const scrollToAd = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const nextAd = () => scrollToAd((currentIndex + 1) % ads.length)
  const prevAd = () => scrollToAd((currentIndex - 1 + ads.length) % ads.length)

  return (
    <section className="py-8 bg-gradient-to-b from-slate-900 to-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold">CANLI</span>
            </div>
            <h2 className="text-xl font-bold text-white md:text-2xl">Marka Reklamları</h2>
            <Badge variant="outline" className="border-white/20 text-white/70 hidden sm:flex">
              <TrendingUp className="h-3 w-3 mr-1" />
              Gerçek zamanlı
            </Badge>
          </div>
          <p className="text-xs text-white/50 hidden md:block">
            Son güncelleme: {lastUpdate ? lastUpdate.toLocaleTimeString('tr-TR') : '--:--:--'}
          </p>
        </div>

        {/* Ads Carousel */}
        <div className="relative">
          {/* Navigation buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full h-10 w-10 -ml-2 md:ml-0"
            onClick={prevAd}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full h-10 w-10 -mr-2 md:mr-0"
            onClick={nextAd}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Ads container */}
          <div 
            ref={scrollRef}
            className="overflow-hidden mx-8 md:mx-12"
          >
            <div 
              className="flex transition-transform duration-500 ease-out gap-4"
              style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
            >
              {ads.map((ad, index) => (
                <Link
                  key={ad.id}
                  href={ad.link}
                  className={`flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 group`}
                  onMouseEnter={() => setIsAutoPlaying(false)}
                  onMouseLeave={() => setIsAutoPlaying(true)}
                >
                  <div className={`relative overflow-hidden rounded-2xl ${ad.backgroundColor} p-6 h-40 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl`}>
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <div className="relative flex items-center gap-4 h-full">
                      {/* Brand logo */}
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white/20 flex-shrink-0" style={{ position: "relative" }}>
                        <Image
                          src={ad.logo}
                          alt={ad.brandName}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-lg font-bold ${ad.textColor} truncate`}>
                          {ad.brandName}
                        </p>
                        <p className={`text-sm ${ad.textColor}/80 mt-1`}>
                          {ad.tagline}
                        </p>
                        {ad.discount && (
                          <div className="mt-2 inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                            <Zap className="h-3 w-3 text-yellow-300" />
                            <span className={`text-xs font-bold ${ad.textColor}`}>
                              {ad.discount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Live indicator */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                      <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                      <span className={`text-xs ${ad.textColor}`}>Canlı</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {ads.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToAd(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Aktif Kampanya", value: ads.length, color: "text-green-400" },
            { label: "Günlük Ziyaretçi", value: "2.4K+", color: "text-blue-400" },
            { label: "Satış Bugün", value: "156", color: "text-purple-400" },
            { label: "Yeni Ürün", value: "23", color: "text-orange-400" },
          ].map((stat) => (
            <div 
              key={stat.label}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
