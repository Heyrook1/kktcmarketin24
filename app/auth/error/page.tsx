import Link from "next/link"
import { AlertTriangle, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary mb-8">
          <ShoppingBag className="h-6 w-6" />
          KKTC Market
        </Link>

        <div className="rounded-2xl border bg-card shadow-sm p-10">
          <div className="flex justify-center mb-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Bir hata oluştu</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Kimlik doğrulama sırasında beklenmedik bir hata meydana geldi. Lütfen tekrar deneyin.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full h-11">
              <Link href="/login">Tekrar Giriş Yap</Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-11">
              <Link href="/">Ana Sayfaya Dön</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
