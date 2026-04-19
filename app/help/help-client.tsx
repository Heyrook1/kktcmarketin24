"use client"

import { useState, useTransition, useRef, useId } from "react"
import Script from "next/script"
import Link from "next/link"
import {
  ChevronDown, Mail, Phone, MapPin, MessageSquare,
  Package, RotateCcw, Truck, ShieldCheck, CreditCard,
  HelpCircle, CheckCircle2, Loader2, Clock, AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// ─── FAQ data ────────────────────────────────────────────────────────────────

const FAQ_SECTIONS = [
  {
    id: "orders",
    icon: Package,
    title: "Sipariş ve Ödeme",
    items: [
      {
        q: "Siparişimi nasıl takip edebilirim?",
        a: "Hesabınıza giriş yaparak 'Siparişlerim' sayfasından tüm siparişlerinizin durumunu anlık olarak takip edebilirsiniz. Sipariş durum değişikliklerinde kayıtlı e-posta adresinize bildirim gönderilir.",
      },
      {
        q: "Hangi ödeme yöntemleri kabul ediliyor?",
        a: "Kredi kartı, banka kartı ve kapıda nakit ödeme seçeneklerimiz mevcuttur. Kapıda ödeme yalnızca kayıtlı hesap sahiplerine sunulmakta olup sipariş öncesi SMS ile kimlik doğrulaması zorunludur.",
      },
      {
        q: "Sipariş SMS doğrulaması neden gerekiyor?",
        a: "Güvenliğinizi ve satıcılarımızı sahte siparişlerden korumak amacıyla her sipariş için telefon numaranıza 6 haneli bir doğrulama kodu gönderilir. Kod 15 dakika geçerlidir; doğrulanmayan siparişler otomatik iptal edilir.",
      },
      {
        q: "Siparişimi iptal edebilir miyim?",
        a: "Siparişiniz kargoya verilmeden önce 'Siparişlerim' sayfasından iptal talebinde bulunabilirsiniz. Kargoya verildikten sonra iade süreci başlatılması gerekir.",
      },
      {
        q: "Birden fazla satıcıdan ürün alabilir miyim?",
        a: "Evet. Farklı satıcılardan ürünleri tek sepette toplayabilir, tek ödemeyle alışverişi tamamlayabilirsiniz. Her satıcının ürünleri ayrı kargolarla teslim edilir.",
      },
    ],
  },
  {
    id: "shipping",
    icon: Truck,
    title: "Kargo ve Teslimat",
    items: [
      {
        q: "Teslimat süreleri ne kadar?",
        a: "Lefkoşa ve çevre bölgelerde genellikle 1–2 iş günü, diğer şehirlerde 2–4 iş günüdür. Satıcı bazlı süreler ürün sayfasında belirtilir.",
      },
      {
        q: "Kargo ücreti ne kadar?",
        a: "Kargo ücreti satıcı ve ürün boyutuna göre değişir; sipariş özetinde açıkça gösterilir. Bazı satıcılar belirli tutar üzerindeki siparişlerde ücretsiz kargo sunmaktadır.",
      },
      {
        q: "Teslimat adresini değiştirebilir miyim?",
        a: "Sipariş henüz kargoya verilmemişse destek ekibimizle iletişime geçerek adres güncellemesi talep edebilirsiniz. Kargoya verildikten sonra adres değişikliği mümkün olmayabilir.",
      },
      {
        q: "Teslimat sırasında evde olmazsam ne olur?",
        a: "Kurye kısa bir not bırakır. Satıcıyla veya kargo firmasıyla iletişime geçerek yeni bir teslimat zamanı ayarlayabilirsiniz.",
      },
    ],
  },
  {
    id: "returns",
    icon: RotateCcw,
    title: "İade ve Değişim",
    items: [
      {
        q: "İade koşulları nelerdir?",
        a: "Ürünü teslim aldıktan itibaren 14 gün içinde, orijinal ambalajında, kullanılmamış ve hasarsız olması koşuluyla iade edebilirsiniz. Gıda, kişisel bakım ürünleri ve dijital içerikler iade kapsamı dışındadır.",
      },
      {
        q: "İade sürecini nasıl başlatırım?",
        a: "'Siparişlerim' sayfasından ilgili siparişi seçip 'İade Talebi Oluştur' butonuna tıklayın. Satıcı talebinizi inceleyerek 2 iş günü içinde yanıt verir.",
      },
      {
        q: "Para iadesi ne zaman yapılır?",
        a: "İade kargo ile satıcıya ulaşıp onaylandıktan sonra ödeme yönteminize göre 3–7 iş günü içinde iadeniz gerçekleştirilir.",
      },
      {
        q: "Hasarlı veya yanlış ürün aldıysam ne yapmalıyım?",
        a: "Ürünün fotoğraflarını çekerek destek formumuzu doldurun. Hasarlı veya yanlış ürünlerde standart iade süreci uygulanmaz; kargo ücreti satıcı tarafından karşılanır.",
      },
    ],
  },
  {
    id: "account",
    icon: ShieldCheck,
    title: "Hesap ve Güvenlik",
    items: [
      {
        q: "Hesap açmadan alışveriş yapabilir miyim?",
        a: "Ürünleri inceleyebilirsiniz; ancak sipariş vermek için hesap oluşturmanız gerekmektedir. Kapıda ödeme yalnızca kayıtlı kullanıcılara açıktır.",
      },
      {
        q: "Şifremi unuttum, ne yapmalıyım?",
        a: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısına tıklayın. Kayıtlı e-posta adresinize parola sıfırlama bağlantısı gönderilecektir.",
      },
      {
        q: "Kişisel verilerim nasıl korunuyor?",
        a: "Verileriniz KVKK kapsamında işlenir, şifreli bağlantı (SSL/TLS) ile iletilir ve yalnızca gerekli süre boyunca saklanır. Detaylar için Gizlilik Politikamızı inceleyebilirsiniz.",
      },
    ],
  },
  {
    id: "seller",
    icon: CreditCard,
    title: "Satıcılar",
    items: [
      {
        q: "Nasıl satıcı olabilirim?",
        a: "Satıcı Başvurusu sayfasını doldurun. Ekibimiz başvurunuzu 2–3 iş günü içinde inceleyerek geri dönüş yapar.",
      },
      {
        q: "Komisyon oranları nedir?",
        a: "Komisyon oranları ürün kategorisine göre değişmekte olup satıcı sözleşmenizde detaylı olarak belirtilir. Genel bilgi için destek ekibimizle iletişime geçebilirsiniz.",
      },
    ],
  },
]

// ─── Shipping & Return Policy ─────────────────────────────────────────────────

const POLICY_ITEMS = [
  {
    icon: Truck,
    title: "Teslimat Politikası",
    points: [
      "Tüm KKTC'ye gönderim yapılmaktadır.",
      "Sipariş onayından itibaren 1–4 iş günü içinde teslimat.",
      "Kargo takip numarası e-posta ile iletilir.",
      "Kapıda ödeme seçeneği tüm bölgelerde geçerlidir.",
    ],
  },
  {
    icon: RotateCcw,
    title: "İade Politikası",
    points: [
      "14 gün içinde koşulsuz iade hakkı.",
      "Ürün orijinal ambalajında, kullanılmamış olmalıdır.",
      "Gıda ve kişisel bakım ürünleri iade edilemez.",
      "Hasarlı teslimat durumunda kargo ücreti satıcıya aittir.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Alıcı Güvencesi",
    points: [
      "SMS OTP ile doğrulanmamış sipariş satıcıya iletilmez.",
      "Ödeme, teslimat onaylanana kadar korunur.",
      "Anlaşmazlık durumunda Marketin24 arabuluculuk yapar.",
      "30 gün içinde çözülemeyen talepler iade ile sonuçlandırılır.",
    ],
  },
]

// ─── Contact form ─────────────────────────────────────────────────────────────

const SUBJECTS = [
  "Sipariş sorunu",
  "İade talebi",
  "Ödeme sorunu",
  "Hesap sorunu",
  "Kargo ve teslimat",
  "Satıcı hakkında şikayet",
  "Diğer",
]

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, p: Record<string, unknown>) => string
      reset: (id: string) => void
    }
  }
}

// ─── Accordion item ────────────────────────────────────────────────────────────

function ContactForm() {
  const [form, setForm] = useState({ fullName: "", email: "", subject: "", message: "" })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [turnstileError, setTurnstileError] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const formId = useId()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"

  function getToken(): string {
    const input = formRef.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')
    return input?.value ?? ""
  }

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
    setSubmitError("")
  }

  function validate(): boolean {
    const next: Partial<typeof form> = {}
    if (!form.fullName.trim())  next.fullName = "Ad Soyad zorunludur."
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Geçerli bir e-posta adresi girin."
    if (!form.subject)          next.subject  = "Lütfen bir konu seçin."
    if (!form.message.trim() || form.message.length < 10)
      next.message = "Mesajınız en az 10 karakter olmalıdır."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError("")
    if (!validate()) return
    const token = getToken()
    if (!token) { setTurnstileError(true); return }
    setTurnstileError(false)
    startTransition(async () => {
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, turnstileToken: token }),
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const payload = await response.json().catch(() => null) as { ok?: boolean } | null
        if (!payload?.ok) {
          throw new Error("invalid-response")
        }
        setSubmitted(true)
      } catch {
        setSubmitError("Mesaj gönderilemedi. Lütfen tekrar deneyin.")
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 border-2 border-green-200">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <p className="font-semibold">Mesajınız alındı!</p>
          <p className="text-sm text-muted-foreground mt-1 text-pretty">
            En kısa sürede size dönüş yapacağız. Yanıt süresi genellikle 1–2 iş günüdür.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <form id={formId} ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrap label="Ad Soyad" id="cf-name" required error={errors.fullName}>
            <Input id="cf-name" placeholder="Adınız Soyadınız" value={form.fullName}
              onChange={e => set("fullName", e.target.value)}
              className={cn(errors.fullName && "border-destructive")} />
          </FieldWrap>
          <FieldWrap label="E-posta" id="cf-email" required error={errors.email}>
            <Input id="cf-email" type="email" placeholder="ad@example.com" value={form.email}
              onChange={e => set("email", e.target.value)}
              className={cn(errors.email && "border-destructive")} />
          </FieldWrap>
        </div>
        <FieldWrap label="Konu" id="cf-subject" required error={errors.subject}>
          <select id="cf-subject" value={form.subject}
            onChange={e => set("subject", e.target.value)}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition",
              !form.subject && "text-muted-foreground",
              errors.subject && "border-destructive"
            )}
          >
            <option value="" disabled>Konu seçin</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FieldWrap>
        <FieldWrap label="Mesajınız" id="cf-message" required error={errors.message}>
          <textarea id="cf-message" rows={4}
            placeholder="Sorununuzu veya talebinizi kısaca açıklayın..."
            value={form.message} onChange={e => set("message", e.target.value)}
            maxLength={2000}
            className={cn(
              "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition resize-none",
              errors.message && "border-destructive"
            )}
          />
          <p className="text-right text-xs text-muted-foreground mt-1">{form.message.length}/2000</p>
        </FieldWrap>

        {/* Declarative Turnstile — script auto-discovers class="cf-turnstile" and renders once */}
        <div>
          <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
          {turnstileError && (
            <p className="text-xs text-destructive mt-1">Güvenlik doğrulaması tamamlanmadı. Lütfen kutucuğu doldurun.</p>
          )}
          {submitError && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-destructive" role="alert">
              <AlertCircle className="h-3.5 w-3.5" />
              {submitError}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isPending} className="w-full gap-2 rounded-xl h-11 font-semibold">
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Gönderiliyor...</>
            : <><MessageSquare className="h-4 w-4" />Mesaj Gönder</>
          }
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Bu form Cloudflare Turnstile ile korunmaktadır.
        </p>
      </form>
    </>
  )
}

function FieldWrap({ label, id, required, error, children }: {
  label: string; id: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ─── Main page component ──────────────────────────────────────────────────────

export function HelpPageClient() {
  const [activeSection, setActiveSection] = useState("orders")

  const activeData = FAQ_SECTIONS.find(s => s.id === activeSection)

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="border-b bg-primary text-primary-foreground px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium mb-5">
            <HelpCircle className="h-3.5 w-3.5" />
            Yardım Merkezi
          </div>
          <h1 className="text-3xl font-bold text-balance md:text-4xl">
            Size nasıl yardımcı olabiliriz?
          </h1>
          <p className="mt-3 text-primary-foreground/80 text-pretty max-w-xl mx-auto leading-relaxed">
            Sık sorulan sorular, iade ve kargo politikası veya doğrudan ekibimizle iletişim.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            {[
              { href: "#faq",     label: "SSS" },
              { href: "#policy",  label: "İade & Kargo" },
              { href: "#contact", label: "İletişim" },
            ].map(({ href, label }) => (
              <a key={href} href={href}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 font-medium hover:bg-white/20 transition-colors">
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 py-12 space-y-16">

        {/* FAQ ─────────────────────────────────────────────────────────────── */}
        <section id="faq" aria-labelledby="faq-heading">
          <div className="mb-8 text-center">
            <h2 id="faq-heading" className="text-2xl font-bold">Sık Sorulan Sorular</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Aradığınızı bulamazsanız aşağıdaki iletişim formunu kullanın.
            </p>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {FAQ_SECTIONS.map(({ id, icon: Icon, title }) => (
              <button key={id} onClick={() => setActiveSection(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors",
                  activeSection === id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50 hover:text-primary"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {title}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6">
              <Accordion type="single" collapsible className="w-full">
                {activeData?.items.map((item, index) => (
                  <AccordionItem key={`${activeSection}-${index}`} value={`${activeSection}-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Policy ──────────────────────────────────────────────────────────── */}
        <section id="policy" aria-labelledby="policy-heading">
          <div className="mb-8 text-center">
            <h2 id="policy-heading" className="text-2xl font-bold">İade ve Kargo Politikası</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Alışverişinizi güvenle yapmanız için tüm kurallar burada.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {POLICY_ITEMS.map(({ icon: Icon, title, points }) => (
              <div key={title} className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Detaylı bilgi için{" "}
            <Link href="/terms" className="text-primary underline underline-offset-2 hover:text-primary/80">
              Kullanım Koşulları
            </Link>
            {" "}ve{" "}
            <Link href="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/80">
              Gizlilik Politikası
            </Link>
            {" "}sayfalarını inceleyin.
          </p>
        </section>

        {/* Contact ─────────────────────────────────────────────────────────── */}
        <section id="contact" aria-labelledby="contact-heading">
          <div className="mb-8 text-center">
            <h2 id="contact-heading" className="text-2xl font-bold">Bize Ulaşın</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Yanıt süremiz genellikle 1–2 iş günüdür.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-5">
            {/* Contact info */}
            <aside className="md:col-span-2 space-y-6">
              <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
                <h3 className="font-semibold text-sm">İletişim Bilgileri</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Telefon</p>
                      <a href="tel:+905338734317" className="text-sm font-medium hover:text-primary transition-colors">
                        +90 533 873 43 17
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">E-posta</p>
                      <a href="mailto:info@marketin24.com" className="text-sm font-medium hover:text-primary transition-colors">
                        info@marketin24.com
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Adres</p>
                      <p className="text-sm font-medium">Lefkoşa, KKTC</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Çalışma Saatleri</p>
                      <p className="text-sm font-medium">Pzt–Cum, 09:00–18:00</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border bg-secondary/40 p-4 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Satıcı olmak ister misiniz?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  KKTC'nin büyüyen pazaryerine katılın.
                </p>
                <Link href="/seller-application"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-1">
                  Başvuru Formu
                  <ChevronDown className="h-3 w-3 -rotate-90" />
                </Link>
              </div>
            </aside>

            {/* Form */}
            <div className="md:col-span-3 rounded-2xl border bg-card p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Destek Formu</h3>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
