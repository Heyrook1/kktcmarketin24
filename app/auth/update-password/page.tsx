"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ShoppingBag, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword]           = useState("")
  const [confirm, setConfirm]             = useState("")
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [done, setDone]                   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.")
      return
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    setDone(true)
    // Redirect to account after 2 seconds
    setTimeout(() => router.push("/account"), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
            <ShoppingBag className="h-6 w-6" />
            KKTC Market
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Yeni Şifre Belirle</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hesabınız için güçlü bir şifre oluşturun
          </p>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-8">
          {done ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Şifreniz güncellendi</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Hesabınıza yönlendiriliyorsunuz…
                </p>
              </div>
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
                    onChange={(e) => setPassword(e.target.value)}
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
                <p className="text-xs text-muted-foreground">
                  En az 8 karakter, harf ve rakam içermeli
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Şifreyi Onayla</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Güncelleniyor…</>
                ) : (
                  "Şifremi Güncelle"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {'← Girişe geri dön'}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
