"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ShieldCheck, Truck, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { extractRoleName } from "@/lib/extract-role-name"

const TRUST_ITEMS = [
  { icon: ShieldCheck, text: "256-bit SSL güvenli bağlantı" },
  { icon: Truck,       text: "Kapıda ödeme imkanı" },
  { icon: CreditCard,  text: "Güvenli ödeme altyapısı" },
]

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail]               = useState("")
  const [password, setPassword]         = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setLoading(false)
      const msg = signInError.message.toLowerCase()
      if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
        setError("E-posta veya şifre hatalı.")
      } else if (msg.includes("email not confirmed")) {
        setError("E-posta adresinizi doğrulamanız gerekiyor.")
      } else if (msg.includes("too many requests")) {
        setError("Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin.")
      } else {
        setError("Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.")
      }
      return
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", data.user?.id)
      .single()

    const roleName = extractRoleName(profileData?.roles)
    const params   = new URLSearchParams(window.location.search)
    let redirectPath = params.get("next") ?? "/"
    if (roleName === "vendor") redirectPath = "/vendor-panel"
    if (roleName === "admin")  redirectPath = "/admin/dashboard"
    if (roleName === "super_admin") redirectPath = "/super-admin"

    setLoading(false)
    router.push(redirectPath)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between p-12 relative overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(155deg, #0f2d5e 0%, #1a4a8a 55%, #2563c4 100%)" }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #7db8f7 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4da6ff 0%, transparent 70%)" }} />

        <div>
          <Link href="/" className="inline-block">
            <Image
              src="/images/kktc-marketin24-logo.png"
              alt="KKTC Marketin24"
              width={180}
              height={180}
              className="h-24 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight text-balance">
              KKTC&apos;nin Lider<br />Pazaryeri
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed text-pretty">
              Binlerce ürün, güvenli alışveriş ve kapıda ödeme imkanıyla alışverişin en kolay hali.
            </p>
          </div>

          <ul className="space-y-3">
            {TRUST_ITEMS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4 text-blue-200" />
                </div>
                <span className="text-sm text-blue-100">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-blue-300/60">
          &copy; {new Date().getFullYear()} Marketin24. Tüm hakları saklıdır.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">

          <div className="mb-8 text-center lg:hidden">
            <Link href="/">
              <Image src="/images/kktc-marketin24-logo.png" alt="KKTC Marketin24" width={120} height={120} className="h-20 w-auto mx-auto" />
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Hoş geldiniz</h2>
            <p className="mt-1 text-sm text-muted-foreground">Hesabınıza giriş yapın</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">E-posta adresi</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                placeholder="ornek@email.com"
                required
                autoComplete="email"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Şifre</Label>
                <Link href="/auth/reset-password" className="text-xs font-medium text-primary hover:underline">
                  Şifremi unuttum?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="h-11 pr-11 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-sm font-semibold"
              disabled={loading}
            >
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Giriş yapılıyor…</>
                : "Giriş Yap"
              }
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">veya</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link href="/auth/sign-up" className="font-semibold text-primary hover:underline">
              Ücretsiz kayıt olun
            </Link>
          </p>

          <div className="mt-8 flex items-center justify-center gap-4 lg:hidden">
            {TRUST_ITEMS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1 text-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground leading-tight max-w-[64px]">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
