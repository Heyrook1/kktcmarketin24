"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail, ShoppingBag, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Lütfen geçerli bir e-posta adresi girin.")
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    setLoading(false)

    if (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.")
      return
    }

    // Always show success — prevents email enumeration
    setSubmitted(true)
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
          <h1 className="mt-4 text-2xl font-bold">Şifremi Sıfırla</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kayıtlı e-posta adresine sıfırlama bağlantısı göndereceğiz
          </p>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-8">

          {submitted ? (
            /* ── Success state ──────────────────────────────── */
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 border-2 border-green-200">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Bağlantı Gönderildi</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Eğer <span className="font-medium text-foreground">{email}</span> adresi
                  sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı birkaç dakika içinde
                  e-posta kutunuza ulaşacaktır.
                </p>
                <p className="text-xs text-muted-foreground">
                  Gelen kutunuzda göremiyorsanız spam/gereksiz klasörünü kontrol edin.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setSubmitted(false); setEmail("") }}
                >
                  Farklı bir e-posta dene
                </Button>
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Giriş sayfasına dön
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* ── Request form ───────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null) }}
                    placeholder="ornek@email.com"
                    required
                    autoComplete="email"
                    autoFocus
                    className="h-11 pl-9"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gönderiliyor…</>
                  : "Sıfırlama Bağlantısı Gönder"
                }
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Giriş sayfasına dön
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Hesabın yok mu?{" "}
          <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
            Üye ol
          </Link>
        </p>
      </div>
    </div>
  )
}
