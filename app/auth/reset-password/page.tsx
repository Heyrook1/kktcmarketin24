"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Loader2, Mail, ShoppingBag,
  CheckCircle2, AlertCircle, UserX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Step = "form" | "not-found" | "sent"

export default function ResetPasswordPage() {
  const [email, setEmail]   = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep]     = useState<Step>("form")
  const [error, setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Lütfen geçerli bir e-posta adresi girin.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })

      const data = await res.json()

      if (res.status === 404) {
        setStep("not-found")
        return
      }

      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu. Lütfen tekrar deneyin.")
        return
      }

      setStep("sent")
    } catch {
      setError("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.")
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep("form")
    setEmail("")
    setError(null)
  }

  // ── Shared page shell ──────────────────────────────────────────────────
  function Shell({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
              <ShoppingBag className="h-6 w-6" />
              Marketin24
            </Link>
          </div>
          {children}
        </div>
      </div>
    )
  }

  // ── Email not found in database ────────────────────────────────────────
  if (step === "not-found") {
    return (
      <Shell>
        <div className="rounded-2xl border bg-card shadow-sm p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-200">
              <UserX className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Hesap Bulunamadı</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">{email}</span> adresiyle
              kayıtlı bir hesap bulunamadı. E-posta adresinizi kontrol edip tekrar deneyin.
            </p>
          </div>
          <div className="space-y-2">
            <Button className="w-full h-11" onClick={reset}>
              Farklı e-posta dene
            </Button>
            <Link href="/auth/sign-up">
              <Button variant="outline" className="w-full h-11">
                Yeni hesap oluştur
              </Button>
            </Link>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Giriş sayfasına dön
          </Link>
        </div>
      </Shell>
    )
  }

  // ── Success: email sent ────────────────────────────────────────────────
  if (step === "sent") {
    return (
      <Shell>
        <div className="rounded-2xl border bg-card shadow-sm p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 border-2 border-green-200">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Bağlantı Gönderildi</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Şifre sıfırlama bağlantısı{" "}
              <span className="font-medium text-foreground">{email}</span> adresine
              gönderildi. Birkaç dakika içinde e-posta kutunuza ulaşacaktır.
            </p>
            <p className="text-xs text-muted-foreground">
              Gelen kutunuzda göremiyorsanız spam / gereksiz klasörünü kontrol edin.
            </p>
          </div>
          <div className="rounded-lg bg-secondary/60 border px-4 py-3 text-left space-y-1.5">
            <p className="text-xs font-semibold text-foreground">Sonraki adımlar:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>E-postadaki &ldquo;Şifremi Sıfırla&rdquo; bağlantısına tıklayın</li>
              <li>Yeni şifrenizi belirleyin</li>
              <li>Hesabınıza giriş yapın</li>
            </ol>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full h-11" onClick={reset}>
              Farklı e-posta dene
            </Button>
            <Link href="/auth/login">
              <Button variant="ghost" className="w-full h-11 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Giriş sayfasına dön
              </Button>
            </Link>
          </div>
        </div>
      </Shell>
    )
  }

  // ── Request form ───────────────────────────────────────────────────────
  return (
    <Shell>
      <div className="rounded-2xl border bg-card shadow-sm p-8">
        <div className="mb-6 text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Mail className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Şifremi Sıfırla</h1>
          <p className="text-sm text-muted-foreground">
            Kayıtlı e-posta adresinize sıfırlama bağlantısı göndereceğiz
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta Adresi</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                placeholder="ornek@email.com"
                required
                autoComplete="email"
                autoFocus
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? "email-error" : undefined}
                className={cn(
                  "h-11 pl-9",
                  error && "border-destructive focus-visible:ring-destructive/50"
                )}
              />
            </div>

            {error && (
              <div
                id="email-error"
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2"
              >
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold"
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kontrol ediliyor…</>
            ) : (
              "Sıfırlama Bağlantısı Gönder"
            )}
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
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Hesabın yok mu?{" "}
        <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
          Üye ol
        </Link>
      </p>
    </Shell>
  )
}
