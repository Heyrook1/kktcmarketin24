"use client"

import { useState, useEffect, useTransition } from "react"
import {
  Tag, Gift, Copy, Check, Plus, Clock, CheckCircle, XCircle,
  Percent, Truck, BadgeDollarSign, FlaskConical, Loader2, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccountStore, Coupon, Gift as GiftType, CouponType } from "@/lib/store/account-store"
import { cn } from "@/lib/utils"
import { claimTestCoupon, getUserCoupons } from "@/app/actions/coupons"

function couponTypeLabel(type: CouponType, value: number) {
  if (type === "percent") return `%${value} indirim`
  if (type === "fixed") return `${value} ₺ indirim`
  return "Ucretsiz kargo"
}

function CouponIcon({ type }: { type: CouponType }) {
  if (type === "percent") return <Percent className="h-5 w-5" />
  if (type === "free_shipping") return <Truck className="h-5 w-5" />
  return <BadgeDollarSign className="h-5 w-5" />
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false)
  const expired = new Date(coupon.expiresAt) < new Date()
  const isUsable = coupon.isActive && !expired && !coupon.usedAt

  function copy() {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div className={cn(
      "rounded-xl border bg-card overflow-hidden transition-all",
      !isUsable && "opacity-60"
    )}>
      <div className="flex">
        {/* Left accent strip */}
        <div className={cn(
          "w-16 shrink-0 flex items-center justify-center",
          isUsable ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
        )}>
          <CouponIcon type={coupon.type} />
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-base tracking-wide font-mono">{coupon.code}</p>
              <p className="text-sm font-medium mt-0.5">{couponTypeLabel(coupon.type, coupon.value)}</p>
              <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
            </div>
            <div className="shrink-0 text-right space-y-1.5">
              {isUsable ? (
                <Badge variant="secondary" className="text-[10px] text-green-700 bg-green-50 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />Kullanilabilir
                </Badge>
              ) : coupon.usedAt ? (
                <Badge variant="secondary" className="text-[10px] text-muted-foreground">Kullanildi</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] text-destructive bg-destructive/10">Suresi Doldu</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {coupon.usedAt
                ? `Kullanim: ${new Date(coupon.usedAt).toLocaleDateString("tr-TR")}`
                : `Son: ${new Date(coupon.expiresAt).toLocaleDateString("tr-TR")}`
              }
              {coupon.minOrderAmount > 0 && (
                <span className="ml-2 text-muted-foreground">· Min. {coupon.minOrderAmount} ₺</span>
              )}
            </div>
            {isUsable && (
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs px-2" onClick={copy}>
                {copied ? <><Check className="h-3.5 w-3.5 text-green-600" />Kopyalandi</> : <><Copy className="h-3.5 w-3.5" />Kopyala</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function GiftCard({ gift }: { gift: GiftType }) {
  const [copied, setCopied] = useState(false)
  const expired = new Date(gift.expiresAt) < new Date()
  const isUsable = !gift.isUsed && !expired

  function copy() {
    navigator.clipboard.writeText(gift.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div className={cn("rounded-xl border bg-card overflow-hidden", !isUsable && "opacity-60")}>
      <div className="flex">
        <div className={cn("w-16 shrink-0 flex items-center justify-center", isUsable ? "bg-amber-50 text-amber-600" : "bg-secondary text-muted-foreground")}>
          <Gift className="h-5 w-5" />
        </div>
        <div className="flex-1 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-base tracking-wide font-mono">{gift.code}</p>
              <p className="text-sm font-semibold text-amber-600 mt-0.5">{gift.amount} ₺ hediye</p>
              <p className="text-xs text-muted-foreground mt-1">Gonderen: <span className="font-medium text-foreground">{gift.from}</span></p>
              {gift.message && <p className="text-xs italic text-muted-foreground mt-1">"{gift.message}"</p>}
            </div>
            <div className="shrink-0">
              {isUsable ? (
                <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                  <Gift className="h-3 w-3 mr-1" />Aktif
                </Badge>
              ) : gift.isUsed ? (
                <Badge variant="secondary" className="text-[10px] text-muted-foreground">Kullanildi</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] text-destructive bg-destructive/10">Suresi Doldu</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {gift.usedAt
                ? `Kullanim: ${new Date(gift.usedAt).toLocaleDateString("tr-TR")}`
                : `Son: ${new Date(gift.expiresAt).toLocaleDateString("tr-TR")}`
              }
            </p>
            {isUsable && (
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs px-2" onClick={copy}>
                {copied ? <><Check className="h-3.5 w-3.5 text-green-600" />Kopyalandi</> : <><Copy className="h-3.5 w-3.5" />Kopyala</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CouponsTab({ userId }: { userId: string }) {
  const { coupons, gifts, addCoupon, setCoupons, addOrUpdateCoupon } = useAccountStore()
  const [code, setCode] = useState("")
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isFetching, setIsFetching] = useState(false)

  // On mount, sync real coupons from DB into the Zustand store
  useEffect(() => {
    setIsFetching(true)
    getUserCoupons()
      .then((dbCoupons) => {
        if (dbCoupons.length > 0) setCoupons(dbCoupons)
      })
      .finally(() => setIsFetching(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  function showMsg(text: string, ok: boolean) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 4000)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    const result = addCoupon(code.trim())
    showMsg(result.message, result.success)
    if (result.success) setCode("")
  }

  function handleClaimTest(couponCode: string) {
    startTransition(async () => {
      const result = await claimTestCoupon(couponCode)
      if (!result.success) {
        showMsg(result.error, false)
        return
      }
      addOrUpdateCoupon(result.coupon)
      showMsg(
        result.alreadyHad
          ? `${result.coupon.code} zaten hesabınızda mevcut.`
          : `${result.coupon.code} test kuponu hesabınıza eklendi!`,
        true
      )
    })
  }

  const TEST_COUPONS = [
    { code: "TEST20",    label: "%20 İndirim" },
    { code: "TEST50TL",  label: "50 ₺ İndirim" },
    { code: "TESTKARGO", label: "Ücretsiz Kargo" },
  ]

  return (
    <div className="space-y-5">

      {/* Test coupon assignment panel */}
      <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary shrink-0" />
            <h2 className="font-semibold text-sm">Test Kuponu Al</h2>
            <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">DEV</Badge>
          </div>
          {isFetching && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />Güncelleniyor
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Aşağıdaki test kuponlarından birini hesabına atayarak ödeme akışını test edebilirsin.
          Her kupon bir kez atanır; tekrar tıklama zaten sahip olduğunu bildirir.
        </p>
        <div className="flex flex-wrap gap-2">
          {TEST_COUPONS.map(({ code: c, label }) => (
            <button
              key={c}
              onClick={() => handleClaimTest(c)}
              disabled={isPending}
              className={cn(
                "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition-all",
                "hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                coupons.some((cp) => cp.code === c) && "border-green-300 bg-green-50 text-green-700"
              )}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              ) : coupons.some((cp) => cp.code === c) ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
              ) : (
                <Plus className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="font-mono tracking-wide">{c}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">— {label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add coupon manually */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-primary" />Kupon Kodu Ekle</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="KUPON KODUNU GIRIN"
            className="font-mono uppercase"
            maxLength={20}
          />
          <Button type="submit" className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />Ekle
          </Button>
        </form>
        {msg && (
          <p className={cn("text-sm px-3 py-2 rounded-lg", msg.ok ? "bg-green-50 text-green-700" : "bg-destructive/10 text-destructive")}>
            {msg.text}
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="coupons">
        <TabsList className="w-full">
          <TabsTrigger value="coupons" className="flex-1">
            Kuponlarim ({coupons.filter((c) => c.isActive && !c.usedAt && new Date(c.expiresAt) > new Date()).length} aktif)
          </TabsTrigger>
          <TabsTrigger value="gifts" className="flex-1">
            Hediyelerim ({gifts.filter((g) => !g.isUsed && new Date(g.expiresAt) > new Date()).length} aktif)
          </TabsTrigger>
        </TabsList>
        <TabsContent value="coupons" className="mt-4 space-y-3">
          {coupons.length === 0 ? (
            <div className="rounded-xl border py-14 text-center">
              <Tag className="mx-auto h-9 w-9 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Henuz kuponunuz yok.</p>
            </div>
          ) : (
            coupons.map((c) => <CouponCard key={c.id} coupon={c} />)
          )}
        </TabsContent>
        <TabsContent value="gifts" className="mt-4 space-y-3">
          {gifts.length === 0 ? (
            <div className="rounded-xl border py-14 text-center">
              <Gift className="mx-auto h-9 w-9 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Henuz hediyeniz yok.</p>
            </div>
          ) : (
            gifts.map((g) => <GiftCard key={g.id} gift={g} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
