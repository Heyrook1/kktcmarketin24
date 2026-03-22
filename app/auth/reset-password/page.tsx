"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
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
