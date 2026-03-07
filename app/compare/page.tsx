import { Metadata } from "next"
import { Check, X, Star, Truck, Shield, CreditCard, Phone, Award, Clock, Users, ShoppingBag, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const metadata: Metadata = {
  title: "Platform Karşılaştırması",
  description: "KKTC'deki e-ticaret platformlarını karşılaştırın. Fiyatlandırma, özellikler ve kullanıcı puanları.",
}

interface Platform {
  name: string
  logo?: string
  rating: number
  reviewCount: number
  description: string
  features: {
    unifiedCheckout: boolean
    multiVendor: boolean
    localDelivery: boolean
    securePayment: boolean
    mobileApp: boolean
    loyaltyProgram: boolean
    customerSupport: string
    returnPolicy: string
    deliveryTime: string
    vendorCount: string
    productRange: string
    paymentMethods: string[]
  }
  pricing: {
    type: string
    commission: string
    monthlyFee: string
  }
  pros: string[]
  cons: string[]
  recommended?: boolean
}

const platforms: Platform[] = [
  {
    name: "Marketin24",
    rating: 4.9,
    reviewCount: 2847,
    description: "KKTC'nin lider çoklu satıcı pazaryeri. Onaylı satıcılar, tek ödeme ve hızlı teslimat.",
    features: {
      unifiedCheckout: true,
      multiVendor: true,
      localDelivery: true,
      securePayment: true,
      mobileApp: true,
      loyaltyProgram: true,
      customerSupport: "7/24 Canlı Destek",
      returnPolicy: "14 Gün İade",
      deliveryTime: "1-3 Gün",
      vendorCount: "8+ Onaylı Satıcı",
      productRange: "500+ Ürün",
      paymentMethods: ["Kredi Kartı", "Banka Kartı", "Havale/EFT", "Kapıda Ödeme"],
    },
    pricing: {
      type: "Komisyon Bazlı",
      commission: "%5-10",
      monthlyFee: "Ücretsiz",
    },
    pros: [
      "Tek sepet, tek ödeme kolaylığı",
      "KKTC'ye özel hızlı teslimat",
      "Onaylı ve güvenilir satıcılar",
      "Rekabetçi fiyatlar",
      "7/24 müşteri desteği",
    ],
    cons: [
      "Yeni platform",
      "Sınırlı satıcı sayısı (büyüyor)",
    ],
    recommended: true,
  },
  {
    name: "Geleneksel E-Ticaret",
    rating: 3.8,
    reviewCount: 1250,
    description: "Tek satıcılı geleneksel online mağazalar.",
    features: {
      unifiedCheckout: false,
      multiVendor: false,
      localDelivery: true,
      securePayment: true,
      mobileApp: false,
      loyaltyProgram: false,
      customerSupport: "Mesai Saatleri",
      returnPolicy: "7-14 Gün",
      deliveryTime: "3-7 Gün",
      vendorCount: "Tek Satıcı",
      productRange: "Sınırlı",
      paymentMethods: ["Kredi Kartı", "Havale"],
    },
    pricing: {
      type: "Sabit Fiyat",
      commission: "Yok",
      monthlyFee: "Değişken",
    },
    pros: [
      "Doğrudan satıcı iletişimi",
      "Uzmanlaşmış ürün yelpazesi",
    ],
    cons: [
      "Ürün çeşitliliği az",
      "Her site için ayrı ödeme",
      "Fiyat karşılaştırması zor",
      "Kargo maliyetleri yüksek",
    ],
  },
  {
    name: "Sosyal Medya Satışı",
    rating: 3.2,
    reviewCount: 890,
    description: "Instagram ve Facebook üzerinden yapılan satışlar.",
    features: {
      unifiedCheckout: false,
      multiVendor: false,
      localDelivery: true,
      securePayment: false,
      mobileApp: true,
      loyaltyProgram: false,
      customerSupport: "DM ile",
      returnPolicy: "Satıcıya Bağlı",
      deliveryTime: "Değişken",
      vendorCount: "Çok Sayıda",
      productRange: "Değişken",
      paymentMethods: ["Havale", "Elden Ödeme"],
    },
    pricing: {
      type: "Satıcıya Bağlı",
      commission: "Yok",
      monthlyFee: "Ücretsiz",
    },
    pros: [
      "Geniş ürün yelpazesi",
      "Doğrudan iletişim",
      "Pazarlık imkanı",
    ],
    cons: [
      "Güvenlik riski yüksek",
      "İade garantisi yok",
      "Ödeme güvencesi yok",
      "Kalite kontrolü yok",
    ],
  },
  {
    name: "Uluslararası Platformlar",
    rating: 4.2,
    reviewCount: 5420,
    description: "Amazon, Trendyol gibi büyük platformlar.",
    features: {
      unifiedCheckout: true,
      multiVendor: true,
      localDelivery: false,
      securePayment: true,
      mobileApp: true,
      loyaltyProgram: true,
      customerSupport: "Online Destek",
      returnPolicy: "14-30 Gün",
      deliveryTime: "7-21 Gün",
      vendorCount: "Binlerce",
      productRange: "Milyonlarca",
      paymentMethods: ["Kredi Kartı", "PayPal"],
    },
    pricing: {
      type: "Komisyon Bazlı",
      commission: "%8-15",
      monthlyFee: "Değişken",
    },
    pros: [
      "Devasa ürün yelpazesi",
      "Güvenilir ödeme sistemi",
      "Müşteri koruma programları",
    ],
    cons: [
      "KKTC'ye teslimat zor/pahalı",
      "Gümrük vergileri",
      "Uzun teslimat süreleri",
      "Yerel destek yok",
    ],
  },
]

const comparisonFeatures = [
  { key: "unifiedCheckout", label: "Tek Ödeme Sistemi", description: "Tüm satıcılardan tek sepette alışveriş" },
  { key: "multiVendor", label: "Çoklu Satıcı", description: "Birden fazla satıcıdan ürün" },
  { key: "localDelivery", label: "KKTC Teslimatı", description: "Yerel adrese hızlı teslimat" },
  { key: "securePayment", label: "Güvenli Ödeme", description: "SSL şifreli güvenli ödeme" },
  { key: "mobileApp", label: "Mobil Uygulama", description: "iOS ve Android uygulaması" },
  { key: "loyaltyProgram", label: "Sadakat Programı", description: "Puan ve indirim sistemi" },
]

function FeatureIcon({ available }: { available: boolean }) {
  return available ? (
    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
      <Check className="h-4 w-4" />
    </div>
  ) : (
    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-500">
      <X className="h-4 w-4" />
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function ComparePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              KKTC Pazaryeri Karşılaştırması
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance">
              En Doğru Seçimi Yapın
            </h1>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              KKTC'deki e-ticaret seçeneklerini karşılaştırın. Fiyatlandırma, özellikler ve kullanıcı deneyimlerini analiz edin.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Cards */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {platforms.map((platform) => (
              <Card 
                key={platform.name} 
                className={`relative ${platform.recommended ? 'border-primary shadow-lg' : ''}`}
              >
                {platform.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Award className="h-3 w-3 mr-1" />
                      Önerilen
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={platform.rating} />
                    <span className="text-xs text-muted-foreground">
                      ({platform.reviewCount.toLocaleString('tr-TR')})
                    </span>
                  </div>
                  <CardDescription className="mt-2 text-sm">
                    {platform.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Features */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Temel Özellikler</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {comparisonFeatures.slice(0, 4).map((feature) => (
                        <div key={feature.key} className="flex items-center gap-1.5">
                          <FeatureIcon available={platform.features[feature.key as keyof typeof platform.features] as boolean} />
                          <span className="text-xs">{feature.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-1 pt-2 border-t">
                    <h4 className="text-sm font-medium">Fiyatlandırma</h4>
                    <div className="text-xs text-muted-foreground">
                      <p>Tip: {platform.pricing.type}</p>
                      <p>Komisyon: {platform.pricing.commission}</p>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>{platform.features.deliveryTime}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-12 md:py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Detaylı Karşılaştırma</h2>
            <p className="text-muted-foreground mt-1">
              Tüm özellikleri yan yana karşılaştırın
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Özellik</TableHead>
                  {platforms.map((platform) => (
                    <TableHead key={platform.name} className="text-center min-w-[150px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold">{platform.name}</span>
                        {platform.recommended && (
                          <Badge variant="outline" className="text-xs">Önerilen</Badge>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Rating */}
                <TableRow>
                  <TableCell className="font-medium">Kullanıcı Puanı</TableCell>
                  {platforms.map((platform) => (
                    <TableCell key={platform.name} className="text-center">
                      <div className="flex justify-center">
                        <StarRating rating={platform.rating} />
                      </div>
                    </TableCell>
                  ))}
                </TableRow>

                {/* Features */}
                {comparisonFeatures.map((feature) => (
                  <TableRow key={feature.key}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{feature.label}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </TableCell>
                    {platforms.map((platform) => (
                      <TableCell key={platform.name} className="text-center">
                        <div className="flex justify-center">
                          <FeatureIcon available={platform.features[feature.key as keyof typeof platform.features] as boolean} />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {/* Delivery Time */}
                <TableRow>
                  <TableCell className="font-medium">Teslimat Süresi</TableCell>
                  {platforms.map((platform) => (
                    <TableCell key={platform.name} className="text-center text-sm">
                      {platform.features.deliveryTime}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Customer Support */}
                <TableRow>
                  <TableCell className="font-medium">Müşteri Desteği</TableCell>
                  {platforms.map((platform) => (
                    <TableCell key={platform.name} className="text-center text-sm">
                      {platform.features.customerSupport}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Return Policy */}
                <TableRow>
                  <TableCell className="font-medium">İade Politikası</TableCell>
                  {platforms.map((platform) => (
                    <TableCell key={platform.name} className="text-center text-sm">
                      {platform.features.returnPolicy}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Commission */}
                <TableRow>
                  <TableCell className="font-medium">Komisyon Oranı</TableCell>
                  {platforms.map((platform) => (
                    <TableCell key={platform.name} className="text-center text-sm">
                      {platform.pricing.commission}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Pros & Cons Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Avantajlar ve Dezavantajlar</h2>
            <p className="text-muted-foreground mt-1">
              Her platformun güçlü ve zayıf yönleri
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {platforms.map((platform) => (
              <Card key={platform.name} className={platform.recommended ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{platform.name}</CardTitle>
                    {platform.recommended && (
                      <Badge className="bg-primary">Önerilen</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-1">
                      <Check className="h-4 w-4" /> Avantajlar
                    </h4>
                    <ul className="space-y-1">
                      {platform.pros.map((pro, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-1.5">
                          <span className="text-green-500 mt-1">•</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                      <X className="h-4 w-4" /> Dezavantajlar
                    </h4>
                    <ul className="space-y-1">
                      {platform.cons.map((con, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-1.5">
                          <span className="text-red-500 mt-1">•</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold">Neden Marketin24?</h2>
              <p className="text-muted-foreground mt-2">
                KKTC'de online alışverişin yeni standardı
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Tek Sepet Kolaylığı</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Farklı satıcılardan ürünler, tek sepette, tek ödeme. Ayrı ayrı sipariş verme derdi yok.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Onaylı Satıcılar</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tüm satıcılarımız titizlikle seçilmiş ve onaylanmış. Güvenle alışveriş yapın.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Hızlı KKTC Teslimatı</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    KKTC genelinde 1-3 gün içinde teslimat. Lefkoşa, Girne, Gazimağusa ve tüm bölgelere.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Güvenli Ödeme</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    SSL şifreli güvenli ödeme altyapısı. Kredi kartı, banka kartı ve kapıda ödeme seçenekleri.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">7/24 Destek</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sorularınız için 7/24 canlı destek. Türkçe müşteri hizmetleri ile her zaman yanınızdayız.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Yerel İşletme Desteği</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    KKTC'deki yerel işletmeleri destekliyoruz. Yerel ekonomiye katkı sağlayan bir platform.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <div className="mt-10 text-center">
              <Button size="lg" asChild>
                <Link href="/products">
                  Hemen Alışverişe Başla
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
