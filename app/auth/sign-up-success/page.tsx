import Link from "next/link"
import { CheckCircle, Mail, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary mb-8">
          <ShoppingBag className="h-6 w-6" />
          KKTC Market
        </Link>

        <div className="rounded-2xl border bg-card shadow-sm p-10">
          <div className="flex justify-center mb-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Hesabın oluşturuldu!</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            E-posta adresine bir doğrulama bağlantısı gönderdik. Hesabını aktif etmek için gelen kutunu kontrol et.
          </p>
          <div className="flex items-center gap-3 rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground mb-6">
            <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
            <span>Doğrulama e-postası spam klasörüne düşmüş olabilir.</span>
          </div>
          <Button asChild className="w-full h-11">
            <Link href="/login">Giriş Yap</Link>
          </Button>
          <div className="mt-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Ana Sayfaya Dön</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
