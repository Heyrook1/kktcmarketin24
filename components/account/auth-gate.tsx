"use client"

import { useState } from "react"
import { Eye, EyeOff, ShieldCheck, User, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccountStore } from "@/lib/store/account-store"
import { cn } from "@/lib/utils"

export function AuthGate() {
  const { login, register } = useAccountStore()

  const [loginForm, setLoginForm] = useState({ email: "ali.kaya@example.com", password: "demo123" })
  const [registerForm, setRegisterForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" })
  const [showPass, setShowPass] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [registerError, setRegisterError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError("")
    if (!loginForm.email || !loginForm.password) {
      setLoginError("E-posta ve şifre gereklidir.")
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      const ok = login(loginForm.email, loginForm.password)
      if (!ok) setLoginError("Geçersiz e-posta veya şifre.")
      setIsLoading(false)
    }, 600)
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegisterError("")
    const { firstName, lastName, email, password, confirm } = registerForm
    if (!firstName || !lastName || !email || !password) {
      setRegisterError("Tüm alanlar zorunludur.")
      return
    }
    if (password !== confirm) {
      setRegisterError("Şifreler eşleşmiyor.")
      return
    }
    if (password.length < 6) {
      setRegisterError("Şifre en az 6 karakter olmalıdır.")
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      register({ firstName, lastName, email, password })
      setIsLoading(false)
    }, 600)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Hesabınıza Girin</h1>
          <p className="text-sm text-muted-foreground">
            Siparişlerinizi, kuponlarınızı ve destek taleplerinizi yönetin.
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="w-full rounded-none border-b bg-transparent h-12">
                <TabsTrigger value="login" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium">
                  Giriş Yap
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium">
                  Kayıt Ol
                </TabsTrigger>
              </TabsList>

              {/* Login */}
              <TabsContent value="login" className="p-6 space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="ornek@email.com"
                        className="pl-9"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-pass">Şifre</Label>
                      <button type="button" className="text-xs text-primary hover:underline">
                        Şifremi unuttum
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-pass"
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-9 pr-9"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPass ? "Şifreyi gizle" : "Şifreyi göster"}
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{loginError}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                  </Button>
                </form>
                <p className="text-center text-xs text-muted-foreground">
                  Demo: <span className="font-mono text-foreground">ali.kaya@example.com</span> / herhangi bir şifre
                </p>
              </TabsContent>

              {/* Register */}
              <TabsContent value="register" className="p-6 space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-first">Ad</Label>
                      <Input
                        id="reg-first"
                        placeholder="Adınız"
                        value={registerForm.firstName}
                        onChange={(e) => setRegisterForm((f) => ({ ...f, firstName: e.target.value }))}
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-last">Soyad</Label>
                      <Input
                        id="reg-last"
                        placeholder="Soyadınız"
                        value={registerForm.lastName}
                        onChange={(e) => setRegisterForm((f) => ({ ...f, lastName: e.target.value }))}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="ornek@email.com"
                        className="pl-9"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-pass">Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-pass"
                        type={showPass ? "text" : "password"}
                        placeholder="En az 6 karakter"
                        className="pl-9 pr-9"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-confirm">Şifre Tekrar</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-confirm"
                        type={showPass ? "text" : "password"}
                        placeholder="Şifrenizi tekrar girin"
                        className="pl-9"
                        value={registerForm.confirm}
                        onChange={(e) => setRegisterForm((f) => ({ ...f, confirm: e.target.value }))}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {registerError && (
                    <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{registerError}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Kayıt yapılıyor..." : "Hesap Oluştur"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Kayıt olarak{" "}
          <a href="#" className="text-primary hover:underline">Kullanım Koşullarını</a>
          {" "}ve{" "}
          <a href="#" className="text-primary hover:underline">Gizlilik Politikasını</a>
          {" "}kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  )
}
