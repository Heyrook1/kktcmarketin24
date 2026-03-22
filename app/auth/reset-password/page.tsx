"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Loader2, Mail, ShoppingBag,
  CheckCircle2, AlertCircle, UserX, Eye, EyeOff, KeyRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type Step = "request" | "not-found" | "sent" | "update" | "success"

// Password strength: 0–4
function strength(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9!@#$%^&*]/.test(pw)) s++
  return s
}

const STRENGTH_LABELS = ["Çok zayıf", "Zayıf", "Orta", "Güçlü", "Çok güçlü"]
const STRENGTH_COLORS = [
  "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500", "bg-green-600",
]

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

export default function ResetPasswordPage() {
  const router = useRouter()

  // Step 1 state
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [requestLoading, setRequestLoading] = useState(false)

  // Step 2 state
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateLoading, setUpdateLoading] = useState(false)

  const [step, setStep] = useState<Step>("request")

  // Detect Supabase PASSWORD_RECOVERY event (fires when user clicks the email link)
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStep("update")
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Step 1: send reset email ──────────────────────────────────────────
  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(null)

    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Lütfen geçerli bir e-posta adresi girin.")
      return
    }

    setRequestLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()

      if (res.status === 404) { setStep("not-found"); return }
      if (!res.ok) { setEmailError(data.error ?? "Bir hata oluştu. Lütfen tekrar deneyin."); return }

      setStep("sent")
    } catch {
      setEmailError("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.")
    } finally {
      setRequestLoading(false)
    }
  }

  // ── Step 2: update password ───────────────────────────────────────────
  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUpdateError(null)

    if (password.length < 8) {
      setUpdateError("Şifre en az 8 karakter olmalıdır.")
      return
    }
    if (password !== confirm) {
      setUpdateError("Şifreler eşleşmiyor.")
      return
    }

    setUpdateLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setUpdateLoading(false)

    if (err) {
      setUpdateError(
        err.message.includes("different from the old password")
          ? "Yeni şifreniz eski şifrenizden farklı olmalıdır."
          : "Şifre güncellenemedi. Lütfen tekrar deneyin."
      )
      return
    }

    setStep("success")
    setTimeout(() => router.push("/auth/login"), 3000)
  }

  function resetToRequest() {
    setStep("request")
    setEmail("")
    setEmailError(null)
  }

  const pw_strength = strength(password)

  // ── Render ────────────────────────────────────────────────────────────

  // Not found
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
              <span className="font-medium text-foreground">{email}</span> adresiyle kayıtlı
              bir hesap bulunamadı. E-posta adresinizi kontrol edip tekrar deneyin.
            </p>
          </div>
          <div className="space-y-2">
            <Button className="w-full h-11" onClick={resetToRequest}>
              Farklı e-posta dene
            </Button>
            <Button variant="outline" className="w-full h-11" asChild>
              <Link href="/auth/sign-up">Yeni hesap oluştur</Link>
            </Button>
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

  // Email sent
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
              <span className="font-medium text-foreground">{email}</span> adresine gönderildi.
            </p>
            <p className="text-xs text-muted-foreground">
              Gelen kutunuzda göremiyorsanız spam / gereksiz klasörünü kontrol edin.
            </p>
          </div>
          <div className="rounded-xl bg-secondary/60 border px-4 py-3 text-left space-y-1.5">
            <p className="text-xs font-semibold">Sonraki adımlar:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>E-postadaki &ldquo;Şifremi Sıfırla&rdquo; bağlantısına tıklayın</li>
              <li>Bu sayfa yeni şifre formuna geçecektir</li>
              <li>Yeni şifrenizi belirleyin</li>
            </ol>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full h-11" onClick={resetToRequest}>
              Farklı e-posta dene
            </Button>
            <Button variant="ghost" className="w-full h-11 gap-2" asChild>
              <Link href="/auth/login">
                <ArrowLeft className="h-4 w-4" />
                Giriş sayfasına dön
              </Link>
            </Button>
          </div>
        </div>
      </Shell>
    )
  }

  // Update password (after clicking email link)
  if (step === "update") {
    return (
      <Shell>
        <div className="rounded-2xl border bg-card shadow-sm p-8">
          <div className="mb-6 text-center space-y-1">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Yeni Şifre Belirle</h1>
            <p className="text-sm text-muted-foreground">
              En az 8 karakter uzunluğunda güçlü bir şifre seçin
            </p>
          </div>

          <form onSubmit={handleUpdateSubmit} className="space-y-5">
            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="password">Yeni Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setUpdateError(null) }}
                  placeholder="En az 8 karakter"
                  required
                  autoComplete="new-password"
                  autoFocus
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          i < pw_strength ? STRENGTH_COLORS[pw_strength] : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn(
                    "text-xs",
                    pw_strength <= 1 ? "text-red-500" :
                    pw_strength === 2 ? "text-yellow-600" : "text-green-600"
                  )}>
                    {STRENGTH_LABELS[pw_strength]}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirm">Şifre Tekrar</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setUpdateError(null) }}
                  placeholder="Şifrenizi tekrar girin"
                  required
                  autoComplete="new-password"
                  aria-invalid={confirm.length > 0 && password !== confirm}
                  className={cn(
                    "h-11 pr-10",
                    confirm.length > 0 && password !== confirm && "border-destructive"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirm.length > 0 && password !== confirm && (
                <p className="text-xs text-destructive">Şifreler eşleşmiyor.</p>
              )}
            </div>

            {updateError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{updateError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={updateLoading || password.length < 8 || password !== confirm}
            >
              {updateLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Güncelleniyor…</>
                : "Şifremi Güncelle"}
            </Button>
          </form>
        </div>
      </Shell>
    )
  }

  // Success
  if (step === "success") {
    return (
      <Shell>
        <div className="rounded-2xl border bg-card shadow-sm p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 border-2 border-green-200">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Şifreniz Güncellendi</h1>
            <p className="text-sm text-muted-foreground">
              Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz…
            </p>
          </div>
          <Button className="w-full h-11" asChild>
            <Link href="/auth/login">Giriş Yap</Link>
          </Button>
        </div>
      </Shell>
    )
  }

  // Default: request form (step === "request")
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

        <form onSubmit={handleRequestSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta Adresi</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                placeholder="ornek@email.com"
                required
                autoComplete="email"
                autoFocus
                disabled={requestLoading}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                className={cn(
                  "h-11 pl-9",
                  emailError && "border-destructive focus-visible:ring-destructive/50"
                )}
              />
            </div>
            {emailError && (
              <div
                id="email-error"
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2"
              >
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{emailError}</p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold"
            disabled={requestLoading || !email.trim()}
          >
            {requestLoading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kontrol ediliyor…</>
              : "Sıfırlama Bağlantısı Gönder"}
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
