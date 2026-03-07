"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Truck, ShieldCheck, CreditCard, MapPin, Sparkles, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/shared/search-bar"
import { Badge } from "@/components/ui/badge"

const dynamicStats = [
  { label: "Aktif Satıcı", value: "8+", icon: ShieldCheck },
  { label: "Ürün Çeşidi", value: "100+", icon: Sparkles },
  { label: "KKTC Kargo", value: "Ücretsiz", icon: Truck },
]

export function CyprusHero() {
  const [currentTime, setCurrentTime] = useState<string>("")
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/Istanbul'
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsLive(prev => !prev)
    }, 1000)
    return () => clearInterval(blinkInterval)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-16 md:py-24">
        {/* Live indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <div className={`h-2 w-2 rounded-full bg-green-400 ${isLive ? 'opacity-100' : 'opacity-50'} transition-opacity`} />
            <span className="text-sm text-white/90 font-medium">Canlı</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <Clock className="h-4 w-4 text-white/80" />
            <span className="text-sm text-white/90 font-mono">{currentTime} KKTC</span>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Content */}
          <div className="flex flex-col gap-8 text-center lg:text-left">
            {/* Cyprus badge */}
            <div className="flex justify-center lg:justify-start">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-2">
                <MapPin className="h-4 w-4 mr-2" />
                Kuzey Kıbrıs Türk Cumhuriyeti
              </Badge>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white text-balance">
                KKTC'nin <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">En Güvenilir</span> Pazaryeri
              </h1>
              <p className="mt-6 text-lg md:text-xl text-white/80 leading-relaxed text-pretty max-w-xl mx-auto lg:mx-0">
                Kıbrıs'ın yerel satıcılarından kaliteli ürünler. Tek sepet, tek ödeme, hızlı teslimat. Marketin24 ile güvenle alışveriş yapın.
              </p>
            </div>

            {/* Search */}
            <div className="w-full max-w-lg mx-auto lg:mx-0">
              <div className="bg-white rounded-xl p-1 shadow-2xl shadow-black/20">
                <SearchBar />
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-lg" asChild>
                <Link href="/products">
                  Ürünleri İncele
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm" asChild>
                <Link href="/compare">Platformları Karşılaştır</Link>
              </Button>
            </div>

            {/* Dynamic Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {dynamicStats.map((stat) => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <stat.icon className="h-6 w-6 text-cyan-400 mx-auto lg:mx-0 mb-2" />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cyprus Island Logo */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="relative">
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full scale-110" />
              
              {/* Main logo container */}
              <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="relative w-80 h-80">
                  <Image
                    src="/images/cyprus-island-logo.jpg"
                    alt="Kıbrıs Adası"
                    fill
                    className="object-contain rounded-2xl"
                    priority
                  />
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                  CANLI
                </div>
                
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-slate-900 text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Tek Ödeme Sistemi
                  </span>
                </div>
              </div>

              {/* Orbiting badges */}
              <div className="absolute top-0 left-0 -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900">%100 Güvenli</p>
                    <p className="text-xs text-slate-500">SSL Korumalı</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 -right-8 bg-white rounded-lg shadow-xl p-3 animate-pulse" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900">Hızlı Teslimat</p>
                    <p className="text-xs text-slate-500">1-3 iş günü</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
