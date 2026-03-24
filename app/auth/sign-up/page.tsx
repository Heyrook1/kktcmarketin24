"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function SignUpPage() {
  const [fullName, setFullName]         = useState("")
  const [email, setEmail]               = useState("")
  const [password, setPassword]         = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)

  function validate(): string | null {
    if (!fullName.trim()) return "Ad Soyad zorunludur."
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email)) return "Geçerli bir e-posta adresi girin."
    if (password.length < 8) return "Şifre en az 8 karakter olmalı."
    if (!/[a-zA-Z]/.test(password)) return "Şifre en az bir harf içermeli."
    if (!/[0-9]/.test(password)) return "Şifre en az bir rakam içermeli."
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: { full_name: fullName, display_name: fullName.split(" ")[0] },
      },
    })

    setLoading(false)

    if (err) {
      const msg = err.message.toLowerCase()
      if (msg.includes("user already registered") || msg.includes("already exists") || msg.includes("already been registered")) {
        setError("Bu e-posta zaten kayıtlı. Giriş yapın.")
      } else {
        setError("Kayıt sırasında hata oluştu, tekrar deneyin.")
      }
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-card shadow-sm p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 border-2 border-green-200">
                <MailCheck className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold">Doğrulama e-postası gönderildi</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              E-posta adresinize doğrulama linki gönderdik.
              Lütfen gelen kutunuzu kontrol edin ve hesabınızı etkinleştirin.
            </p>
            <p className="text-xs text-muted-foreground">
              Gönderilen adres: <span className="font-medium text-foreground">{email}</span>
            </p>
            <Button asChild className="w-full h-11 mt-2">
              <Link href="/auth/login">Giriş sayfasına git</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Image
              src="/images/kktc-marketin24-logo.png"
              alt="KKTC Marketin24"
              width={120}
              height={120}
              className="h-20 w-auto mx-auto"
              priority
            />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Hesap oluştur</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hızlı ve güvenli alışverişe başla</p>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ad Soyad</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(null) }}
                placeholder="Adınız Soyadınız"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                placeholder="ornek@email.com"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  placeholder="En az 8 karakter"
                  required
                  autoComplete="new-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">En az 8 karakter, harf ve rakam içermeli</p>
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
                {error.includes("zaten kayıtlı") && (
                  <Link href="/auth/login" className="ml-1 font-medium underline hover:text-red-800">
                    Giriş yap
                  </Link>
                )}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Hesap oluşturuluyor…</>
                : "Üye Ol"
              }
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Üye olarak{" "}
              <Link href="/terms" className="underline hover:text-foreground">Kullanım Şartları</Link>
              {" "}ve{" "}
              <Link href="/privacy" className="underline hover:text-foreground">Gizlilik Politikası</Link>
              {"'nı"} kabul etmiş olursunuz.
            </p>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Zaten hesabın var mı?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Giriş yap
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

