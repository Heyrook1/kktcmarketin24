"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, CheckCircle2, Loader2, Mail, KeyRound, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const [email, setEmail]   = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [sent, setSent]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Geçerli bir e-posta adresi girin.")
      return
    }
    setError(null)
    setLoading(true)

    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: trimmed }),
      })
      const body = await res.json() as { ok?: boolean; error?: string }

      if (res.status === 404) {
        setError("Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.")
        setLoading(false)
        return
      }
      if (!res.ok || body.error) {
        setError(body.error ?? "Bir hata oluştu. Lütfen tekrar deneyin.")
        setLoading(false)
        return
      }
      setSent(true)
    } catch {
      setError("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between p-12 relative overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(155deg, #0f2d5e 0%, #1a4a8a 55%, #2563c4 100%)" }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #7db8f7 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4da6ff 0%, transparent 70%)" }} />

        <Link href="/" className="inline-block">
          <Image
            src="/images/marketin24-logo.png"
            alt="Marketin24"
            width={180}
            height={60}
            className="h-14 w-auto brightness-0 invert"
            priority
          />
        </Link>

        <div className="space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
            <KeyRound className="h-8 w-8 text-blue-200" />
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight text-balance">
            Şifrenizi mi unuttunuz?
          </h1>
          <p className="text-blue-200 leading-relaxed text-pretty">
            Endişelenmeyin! Kayıtlı e-posta adresinize sıfırlama bağlantısı göndereceğiz. Birkaç saniye içinde gelen kutunuzu kontrol edin.
          </p>
        </div>

        <p className="text-xs text-blue-300/60">
          &copy; {new Date().getFullYear()} Marketin24. Tüm hakları saklıdır.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <Link href="/">
              <Image src="/images/marketin24-logo.png" alt="Marketin24" width={160} height={54} className="h-12 w-auto mx-auto" />
            </Link>
          </div>

          {sent ? (
            /* ── Success state ── */
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)" }}
                >
                  <CheckCircle2 className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">E-posta gönderildi!</h2>
                <p className="text-muted-foreground leading-relaxed text-pretty">
                  <span className="font-semibold text-foreground">{email}</span> adresine şifre
                  sıfırlama bağlantısı gönderildi.
                </p>
              </div>

              <div className="rounded-2xl border bg-secondary/40 p-5 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm space-y-0.5">
                    <p className="font-medium">Gelen kutunuzu kontrol edin</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">E-posta birkaç dakika içinde ulaşacaktır. Spam klasörünü de kontrol etmeyi unutmayın.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl"
                  onClick={() => { setSent(false); setEmail("") }}
                >
                  Farklı e-posta dene
                </Button>
                <Button asChild className="w-full h-11 rounded-xl">
                  <Link href="/auth/login">Giriş sayfasına dön</Link>
                </Button>
              </div>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground">Şifre Sıfırlama</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kayıtlı e-posta adresinizi girin, sıfırlama bağlantısı gönderelim.
                </p>
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
                    aria-invalid={!!error}
                    aria-describedby={error ? "email-error" : undefined}
                  />
                </div>

                {error && (
                  <div
                    id="email-error"
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-sm font-semibold"
                  disabled={loading || !email.trim()}
                >
                  {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gönderiliyor…</>
                    : "Sıfırlama Bağlantısı Gönder"
                  }
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Girişe geri dön
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Step 1: Check if the email is registered before sending anything
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const checkData = await checkRes.json() as { exists: boolean | null }

      // exists === false means definitively not registered
      if (checkData.exists === false) {
        setError("Bu e-posta adresi sistemimizde kayıtlı değil. Lütfen kayıtlı e-posta adresinizi girin.")
        setLoading(false)
        return
      }

      // exists === null means the server check failed — block to be safe
      if (checkData.exists === null) {
        setError("E-posta doğrulanamadı. Lütfen daha sonra tekrar deneyin.")
        setLoading(false)
        return
      }

      // Step 2: Email is registered (or check was inconclusive) — send reset link
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
            <ShoppingBag className="h-6 w-6" />
            KKTC Market
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Şifre Sıfırlama</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            E-posta adresinize sıfırlama bağlantısı göndereceğiz
          </p>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-8">
          {sent ? (
            /* Success state */
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">E-posta gönderildi</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">{email}</span> adresine şifre
                  sıfırlama bağlantısı gönderildi. Gelen kutunuzu ve spam klasörünüzü kontrol edin.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-2 w-full h-11"
                onClick={() => { setSent(false); setEmail("") }}
              >
                Farklı e-posta dene
              </Button>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gönderiliyor…
                  </>
                ) : (
                  "Sıfırlama Bağlantısı Gönder"
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Girişe geri dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
