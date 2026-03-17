"use client"

import { useState, useTransition, useId, useRef } from "react"
import Link from "next/link"
import Script from "next/script"
import {
  Store, ChevronRight, CheckCircle2, Mail, Clock,
  Loader2, ShieldCheck, TrendingUp, Users, Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormData {
  fullName: string
  email: string
  phone: string
  storeName: string
  category: string
  city: string
  description: string
  agree: boolean
}

const INITIAL: FormData = {
  fullName: "",
  email: "",
  phone: "",
  storeName: "",
  category: "",
  city: "",
  description: "",
  agree: false,
}

const CATEGORIES = [
  "Elektronik",
  "Giyim & Aksesuar",
  "Ev & Yaşam",
  "Gıda & İçecek",
  "Spor & Outdoor",
  "Kozmetik & Kişisel Bakım",
  "Kitap, Müzik & Film",
  "Bebek & Çocuk",
  "Otomotiv",
  "Diğer",
]

const CITIES = ["Lefkoşa", "Gazimağusa", "Girne", "Güzelyurt", "İskele", "Lefke"]

const BENEFITS = [
  { icon: TrendingUp,  title: "Büyüyen Pazar",         desc: "KKTC'nin en hızlı büyüyen pazaryerine katılın." },
  { icon: Users,       title: "Geniş Müşteri Kitlesi",  desc: "Binlerce alıcıya anında ulaşın." },
  { icon: Globe,       title: "Kolay Yönetim",          desc: "Tek panelden tüm operasyonunuzu yönetin." },
  { icon: ShieldCheck, title: "Güvenli Altyapı",        desc: "Ödemeleriniz %100 güvence altında." },
]

// Cloudflare Turnstile imperative API type
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, params: Record<string, unknown>) => string
      reset: (widgetId: string) => void
    }
  }
}

// Use Cloudflare's official always-pass test key when no real key is provided.
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"

export default function SellerApplicationPage() {
  const [form, setForm] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileError, setTurnstileError] = useState(false)
  const widgetIdRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const formId = useId()

  // Called exactly once by next/script onLoad — guard prevents double render
  function handleScriptLoad() {
    if (!window.turnstile || !containerRef.current || widgetIdRef.current) return
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: "light",
      callback: (token: string) => {
        setTurnstileToken(token)
        setTurnstileError(false)
      },
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileError(true),
    })
  }

  function set(field: keyof FormData, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormData, string>> = {}
    if (!form.fullName.trim())   next.fullName  = "Ad Soyad zorunludur."
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                  next.email     = "Geçerli bir e-posta adresi girin."
    if (!form.phone.trim())      next.phone     = "Telefon numarası zorunludur."
    if (!form.storeName.trim())  next.storeName = "Mağaza adı zorunludur."
    if (!form.category)          next.category  = "Lütfen bir kategori seçin."
    if (!form.city)              next.city      = "Lütfen bir şehir seçin."
    if (!form.agree)             next.agree     = "Koşulları kabul etmeniz gerekiyor."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (!turnstileToken) { setTurnstileError(true); return }

    startTransition(async () => {
      await fetch("/api/seller-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken }),
      })
      // Always show success — prevents enumeration
      setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 border-2 border-green-200">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-balance">Başvurunuz Alındı!</h1>
            <p className="text-muted-foreground leading-relaxed text-pretty">
              Satıcı başvurunuz ekibimize iletildi ve inceleme aşamasına girdi. En kısa sürede sizinle iletişime geçeceğiz.
            </p>
          </div>
          <div className="rounded-xl border bg-secondary/50 p-4 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Değerlendirme Süreci</p>
                <p className="text-xs text-muted-foreground mt-0.5">Başvurular genellikle 2–3 iş günü içinde incelenir.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">E-posta ile Bildirim</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sonuç kayıtlı e-posta adresinize iletilecektir.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline" className="flex-1 rounded-xl">
              <Link href="/">Ana Sayfaya Dön</Link>
            </Button>
            <Button asChild className="flex-1 rounded-xl">
              <Link href="/products">Alışverişe Devam Et</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Script tag is rendered once — onLoad fires render, ref guard prevents duplicates */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-primary px-4 py-14 text-primary-foreground md:py-20">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/20" />
          <div className="absolute bottom-0 -left-10 h-48 w-48 rounded-full bg-white/10" />
        </div>
        <div className="relative container mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium mb-5">
            <Store className="h-3.5 w-3.5" />
            Satıcı Programı
          </div>
          <h1 className="text-3xl font-bold leading-tight text-balance md:text-4xl lg:text-5xl">
            Marketin24&apos;te Satıcı Olun
          </h1>
          <p className="mt-4 max-w-xl text-primary-foreground/80 text-pretty leading-relaxed md:text-lg">
            KKTC&apos;nin büyüyen pazaryerine katılın. Ürünlerinizi binlerce müşteriye kolayca ulaştırın.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Kolay Kurulum", "Düşük Komisyon", "7/24 Destek", "Güvenli Ödeme"].map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs font-medium">
                <CheckCircle2 className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">

          {/* Benefits */}
          <aside className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="font-semibold text-lg">Neden Marketin24?</h2>
              <p className="text-sm text-muted-foreground mt-1 text-pretty">
                KKTC&apos;de e-ticarete adım atmak için en doğru platform.
              </p>
            </div>
            <ul className="space-y-4">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border bg-secondary/40 p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sorularınız için</p>
              <a
                href="mailto:info@marketin24.com"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Mail className="h-4 w-4 shrink-0" />
                info@marketin24.com
              </a>
            </div>
          </aside>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border bg-card p-6 md:p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Başvuru Formu</h2>
              </div>

              <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ad Soyad" id="fullName" required error={errors.fullName}>
                    <Input id="fullName" placeholder="Ahmet Yılmaz" value={form.fullName}
                      onChange={(e) => set("fullName", e.target.value)}
                      aria-invalid={!!errors.fullName}
                      className={cn(errors.fullName && "border-destructive focus-visible:ring-destructive/50")} />
                  </Field>
                  <Field label="E-posta" id="email" required error={errors.email}>
                    <Input id="email" type="email" placeholder="ahmet@example.com" value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      aria-invalid={!!errors.email}
                      className={cn(errors.email && "border-destructive focus-visible:ring-destructive/50")} />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Telefon" id="phone" required error={errors.phone}>
                    <Input id="phone" type="tel" placeholder="+90 5XX XXX XX XX" value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      aria-invalid={!!errors.phone}
                      className={cn(errors.phone && "border-destructive focus-visible:ring-destructive/50")} />
                  </Field>
                  <Field label="Mağaza Adı" id="storeName" required error={errors.storeName}>
                    <Input id="storeName" placeholder="Mağazanızın adı" value={form.storeName}
                      onChange={(e) => set("storeName", e.target.value)}
                      aria-invalid={!!errors.storeName}
                      className={cn(errors.storeName && "border-destructive focus-visible:ring-destructive/50")} />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ürün Kategorisi" id="category" required error={errors.category}>
                    <select id="category" value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                      aria-invalid={!!errors.category}
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition",
                        !form.category && "text-muted-foreground",
                        errors.category && "border-destructive"
                      )}>
                      <option value="" disabled>Seçiniz</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Şehir" id="city" required error={errors.city}>
                    <select id="city" value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      aria-invalid={!!errors.city}
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition",
                        !form.city && "text-muted-foreground",
                        errors.city && "border-destructive"
                      )}>
                      <option value="" disabled>Seçiniz</option>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Kısa Açıklama" id="description">
                  <textarea id="description" rows={3}
                    placeholder="Kendinizi ve satmak istediğiniz ürünleri kısaca tanıtın..."
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    maxLength={500}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition resize-none" />
                  <p className="text-right text-xs text-muted-foreground mt-1">{form.description.length}/500</p>
                </Field>

                {/* Turnstile container — always present in DOM so ref is valid when onLoad fires */}
                <div>
                  <div ref={containerRef} />
                  {turnstileError && (
                    <p className="text-xs text-destructive mt-1">
                      Güvenlik doğrulaması başarısız. Lütfen sayfayı yenileyip tekrar deneyin.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input type="checkbox" checked={form.agree}
                      onChange={(e) => set("agree", e.target.checked)}
                      aria-invalid={!!errors.agree}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary cursor-pointer" />
                    <span className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                      <Link href="/terms" className="text-primary underline underline-offset-2 hover:text-primary/80">Kullanım Koşulları</Link>
                      {" "}ve{" "}
                      <Link href="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/80">Gizlilik Politikası</Link>
                      {"'nı"} okudum ve kabul ediyorum.
                    </span>
                  </label>
                  {errors.agree && <p className="text-xs text-destructive pl-6">{errors.agree}</p>}
                </div>

                <Button type="submit" disabled={isPending}
                  className="w-full rounded-xl gap-2 h-11 text-sm font-semibold">
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Gönderiliyor...</>
                  ) : (
                    <><ChevronRight className="h-4 w-4" />Başvuruyu Gönder</>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Bu form Cloudflare Turnstile ile korunmaktadır.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, id, required, error, children,
}: {
  label: string; id: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
