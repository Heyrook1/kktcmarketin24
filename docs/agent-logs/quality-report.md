# Quality Report

## Command
`pnpm typecheck && pnpm lint && pnpm test:qa`

## Status
FAIL

## Output
```
> my-project@0.1.0 typecheck /workspace
> tsc --noEmit

app/actions/coupons.ts(103,17): error TS2352: Conversion of type 'any[]' to type 'Record<string, unknown>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Index signature for type 'string' is missing in type 'any[]'.
app/api/auth/check-email/route.ts(40,30): error TS2551: Property 'getUserByEmail' does not exist on type 'GoTrueAdminApi'. Did you mean 'getUserById'?
app/api/orders/[id]/no-show/route.ts(53,21): error TS2352: Conversion of type '{ name: any; }[] | undefined' to type '{ name: string; } | null' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'name' is missing in type '{ name: any; }[]' but required in type '{ name: string; }'.
app/api/reliability/score/route.ts(46,21): error TS2352: Conversion of type '{ name: any; }[] | undefined' to type '{ name: string; } | null' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'name' is missing in type '{ name: any; }[]' but required in type '{ name: string; }'.
app/api/reliability/score/route.ts(71,21): error TS2352: Conversion of type '{ name: any; }[] | undefined' to type '{ name: string; } | null' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'name' is missing in type '{ name: any; }[]' but required in type '{ name: string; }'.
app/api/vendor/orders/[id]/delivery-event/route.ts(74,52): error TS2339: Property 'message' does not exist on type 'OrderOwnershipResult'.
  Property 'message' does not exist on type '{ ok: true; session: VendorSession; vendorOrderId: string; }'.
app/api/vendor/orders/[id]/delivery-event/route.ts(74,84): error TS2339: Property 'status' does not exist on type 'OrderOwnershipResult'.
  Property 'status' does not exist on type '{ ok: true; session: VendorSession; vendorOrderId: string; }'.
app/api/vendor/orders/[id]/delivery-event/route.ts(92,21): error TS2352: Conversion of type 'GenericStringError' to type 'VendorOrderLookup' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ error: true; } & String' is missing the following properties from type 'VendorOrderLookup': id, store_id, customer_email, total, created_at
app/api/vendor/orders/[id]/route.ts(59,21): error TS2352: Conversion of type 'GenericStringError' to type 'VendorOrderRow' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ error: true; } & String' is missing the following properties from type 'VendorOrderRow': id, store_id, customer_name, customer_email, and 4 more.
app/api/vendor/orders/[id]/route.ts(157,28): error TS2339: Property 'order_number' does not exist on type 'never'.
app/api/vendor/orders/[id]/route.ts(164,30): error TS2339: Property 'customer_phone' does not exist on type 'never'.
app/api/vendor/orders/[id]/route.ts(165,30): error TS2339: Property 'payment_status' does not exist on type 'never'.
app/api/vendor/orders/[id]/route.ts(166,27): error TS2339: Property 'coupon_code' does not exist on type 'never'.
app/api/vendor/orders/[id]/route.ts(167,31): error TS2339: Property 'subtotal' does not exist on type 'never'.
app/api/vendor/orders/[id]/route.ts(168,35): error TS2339: Property 'shipping_fee' does not exist on type 'never'.
app/api/vendor/orders/[id]/route.ts(169,38): error TS2339: Property 'discount_amount' does not exist on type 'never'.
app/api/vendor/orders/[id]/route.ts(170,28): error TS2339: Property 'total' does not exist on type 'never'.
app/api/vendor/orders/[id]/route.ts(171,26): error TS2339: Property 'created_at' does not exist on type 'never'.
app/api/vendor/orders/[id]/route.ts(172,33): error TS2339: Property 'delivery_address' does not exist on type 'never'.
app/cart/cart-content.tsx(100,33): error TS2339: Property 'selectedVariant' does not exist on type 'Product'.
app/cart/cart-content.tsx(100,60): error TS2339: Property 'variant' does not exist on type 'Product'.
app/cart/cart-content.tsx(102,36): error TS2339: Property 'selectedVariant' does not exist on type 'Product'.
app/cart/cart-content.tsx(102,63): error TS2339: Property 'variant' does not exist on type 'Product'.
app/products/[id]/product-detail.tsx(458,76): error TS2339: Property 'reviewCount' does not exist on type 'Vendor'.
app/products/[id]/product-detail.tsx(461,49): error TS2339: Property 'productCount' does not exist on type 'Vendor'.
app/products/products-content.tsx(308,13): error TS2339: Property 'vendorName' does not exist on type 'Product'.
app/urunler/[id]/page.tsx(154,38): error TS2339: Property 'vendor_stores' does not exist on type 'never'.
app/urunler/[id]/page.tsx(154,59): error TS2339: Property 'vendor_stores' does not exist on type 'never'.
app/urunler/[id]/page.tsx(154,82): error TS2339: Property 'vendor_stores' does not exist on type 'never'.
app/urunler/[id]/page.tsx(159,36): error TS2339: Property 'store_id' does not exist on type 'never'.
app/urunler/[id]/page.tsx(179,25): error TS2339: Property 'category' does not exist on type 'never'.
app/urunler/[id]/page.tsx(189,40): error TS2322: Type 'Vendor | { id: any; name: any; slug: any; description: any; logo: any; rating: number; reviewCount: number; productCount: number; isVerified: any; createdAt: string; } | undefined' is not assignable to type 'Vendor | undefined'.
  Type '{ id: any; name: any; slug: any; description: any; logo: any; rating: number; reviewCount: number; productCount: number; isVerified: any; createdAt: string; }' is missing the following properties from type 'Vendor': coverImage, joinedDate, location, categories, and 2 more.
app/urunler/page.tsx(85,11): error TS2322: Type '{ id: string; slug: string; name: string; description: string; image: string; productCount: number; }[]' is not assignable to type 'Category[]'.
  Property 'icon' is missing in type '{ id: string; slug: string; name: string; description: string; image: string; productCount: number; }' but required in type 'Category'.
app/urunler/page.tsx(86,11): error TS2322: Type '{ id: any; name: any; slug: any; description: string; logo: string; rating: number; reviewCount: number; productCount: number; isVerified: boolean; createdAt: string; }[]' is not assignable to type 'Vendor[]'.
  Type '{ id: any; name: any; slug: any; description: string; logo: string; rating: number; reviewCount: number; productCount: number; isVerified: boolean; createdAt: string; }' is missing the following properties from type 'Vendor': coverImage, joinedDate, location, categories, and 2 more.
app/vendor-panel/orders/page.tsx(99,17): error TS2352: Conversion of type 'GenericStringError[]' to type 'VoRow[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ error: true; } & String' is missing the following properties from type 'VoRow': id, customer_name, customer_email, items_count, and 3 more.
app/vendors/page.tsx(105,34): error TS2339: Property 'reviewCount' does not exist on type 'Vendor'.
components/account/tabs/support-tab.tsx(153,20): error TS2345: Argument of type '{ subject: string; category: SupportCategory; relatedOrderId: string | undefined; initialMessage: string; }' is not assignable to parameter of type 'Omit<SupportTicket, "id" | "createdAt" | "updatedAt" | "messages"> & { initialMessage: string; }'.
  Property 'status' is missing in type '{ subject: string; category: SupportCategory; relatedOrderId: string | undefined; initialMessage: string; }' but required in type 'Omit<SupportTicket, "id" | "createdAt" | "updatedAt" | "messages">'.
components/home/hero-floating-cards.tsx(91,9): error TS2322: Type 'Element' is not assignable to type 'string | number'.
components/home/hero-floating-cards.tsx(128,9): error TS2322: Type 'Element' is not assignable to type 'string | number'.
components/product/product-card.tsx(26,12): error TS2352: Conversion of type 'Product' to type '{ stock: number; }' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'stock' is missing in type 'Product' but required in type '{ stock: number; }'.
components/vendor/vendor-profile-sheet.tsx(97,80): error TS2339: Property 'reviewCount' does not exist on type 'Vendor'.
components/vendor/vendor-profile-sheet.tsx(102,63): error TS2339: Property 'productCount' does not exist on type 'Vendor'.
lib/smart-search.ts(77,3): error TS1117: An object literal cannot have multiple properties with the same name.
 ELIFECYCLE  Command failed with exit code 1.
```

## Summary
Kalite zinciri depodaki mevcut TypeScript hataları nedeniyle başarısız oldu. Hatalar bu çalışmanın kapsamı dışındaki dosyalarda yoğunlaşıyor.
