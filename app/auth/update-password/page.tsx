"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ShoppingBag, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)

  useEffect(() => {
    // Supabase SSR puts the recovery token in the URL hash as #access_token=...&type=recovery
    // onAuthStateChange fires with PASSWORD_RECOVERY when the token is valid.
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true)
      }
    })

    // Also check if already in a recovery session (page refresh case)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
    })

    // If no PASSWORD_RECOVERY event fires within 3s, the link is invalid/expired
    const timer = setTimeout(() => {
      if (!sessionReady) setInvalidLink(true)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): string | null {
    if (password.length < 8) return "Şifre en az 8 karakter olmalıdır."
    if (password !== confirm) return "Şifreler eşleşmiyor."
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (err) {
      setError(err.message === "New password should be different from the old password."
        ? "Yeni şifreniz eski şifrenizden farklı olmalıdır."
        : "Şifre güncellenemedi. Lütfen tekrar deneyin.")
      return
    }

    setSuccess(true)
    // Auto-redirect to account after 3s
    setTimeout(() => router.push("/account"), 3000)
  }

  // ── Invalid / expired link ─────────────────────────────────────────────
  if (invalidLink && !sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 border-2 border-red-200">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Bağlantı Geçersiz veya Süresi Dolmuş</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Şifre sıfırlama bağlantısı geçersiz ya da süresi dolmuş. Lütfen yeni bir bağlantı talep edin.
            </p>
          </div>
          <Link href="/auth/reset-password">
            <Button className="w-full h-11">Yeni Bağlantı Talep Et</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 border-2 border-green-200">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Şifreniz Güncellendi</h1>
            <p className="text-sm text-muted-foreground">
              Şifreniz başarıyla değiştirildi. Hesabınıza yönlendiriliyorsunuz…
            </p>
          </div>
          <Link href="/account">
            <Button className="w-full h-11">Hesabıma Git</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── New password form ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
            <ShoppingBag className="h-6 w-6" />
            KKTC Market
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Yeni Şifre Belirle</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            En az 8 karakter uzunluğunda güçlü bir şifre seçin
          </p>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-8">
          {!sessionReady ? (
            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Doğrulanıyor…</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">Yeni Şifre</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null) }}
                    placeholder="En az 8 karakter"
                    required
                    autoComplete="new-password"
                    autoFocus
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
                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          password.length >= n * 3
                            ? password.length >= 12 ? "bg-green-500"
                              : password.length >= 8 ? "bg-yellow-500"
                              : "bg-red-400"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Şifre Tekrar</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(null) }}
                    placeholder="Şifrenizi tekrar girin"
                    required
                    autoComplete="new-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? "Şifreyi gizle" : "Şifreyi göster"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirm.length > 0 && password !== confirm && (
                  <p className="text-xs text-red-500">Şifreler eşleşmiyor.</p>
                )}
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Güncelleniyor…</>
                  : "Şifremi Güncelle"
                }
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
