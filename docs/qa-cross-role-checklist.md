# Cross-Role QA Checklist

This checklist is the executable scenario matrix for customer, vendor, and admin flows.

## Severity Guide

- P0: Checkout/order lifecycle/data integrity break
- P1: Wrong permissions, incorrect status visibility, major UX break
- P2: Minor UX mismatch, copy issue, non-blocking enhancement

## Scenario Matrix

| ID | Severity | Actor | Scenario | Expected Result | Key Paths |
|---|---|---|---|---|---|
| CUS-001 | P0 | Customer | Browse products on home/listing/category | Product cards load from DB consistently | `app/page.tsx`, `app/urunler/page.tsx`, `app/category/[slug]/page.tsx` |
| CUS-002 | P0 | Customer | Add cart items and open checkout | Cart totals and items remain consistent | `lib/store/cart-store.ts`, `app/cart/cart-content.tsx`, `app/checkout/checkout-content.tsx` |
| CUS-003 | P0 | Customer | Place order (authenticated) | Order, sub-orders, vendor_orders, history rows are created and stock decrements | `app/api/checkout/place-order/route.ts` |
| CUS-004 | P0 | Customer | Cancel order before vendor confirmation | Stock restored, `vendor_orders` move to cancelled, history row exists | `app/api/orders/[id]/cancel/route.ts` |
| CUS-005 | P1 | Customer | Edit delivery address before vendor confirmation | Allowed only while all vendor rows are pending | `app/api/orders/[id]/delivery/route.ts`, `components/account/tabs/orders-tab.tsx` |
| CUS-006 | P0 | Customer | Request return | Server validates ownership, delivered status and 14-day window | `app/api/returns/route.ts` |
| CUS-007 | P1 | Customer | Order confirmation opened/reloaded | Duplicate order-placed email is prevented (idempotent) | `app/order-confirmation/[id]/order-confirmation-client.tsx`, `app/api/notifications/order-placed/route.ts` |
| VEN-001 | P0 | Vendor | Update order status through allowed transitions | Only valid transitions persist; history row appended | `app/api/vendor/orders/[id]/status/route.ts`, `components/vendor/vendor-orders-table.tsx` |
| VEN-002 | P1 | Vendor | Access vendor panel as non-vendor user | Access denied/redirected | `app/vendor-panel/layout.tsx`, `middleware.ts`, `lib/vendor-auth.ts` |
| VEN-003 | P1 | Vendor | Create/update product | Ownership verified; only allowed fields saved | `app/api/vendor/products/route.ts`, `app/api/vendor/products/[id]/route.ts` |
| VEN-004 | P1 | Vendor | Handle return requests | Only return owner store can approve/reject/complete | `app/api/returns/[id]/route.ts`, `app/api/vendor/returns/route.ts` |
| ADM-001 | P0 | Admin | Admin-only API access | Non-admin blocked from admin APIs | `lib/admin-auth.ts`, `app/api/admin/**` |
| ADM-002 | P1 | Admin | Admin dashboard route access | Non-admin redirected away from `/admin` | `app/admin/layout.tsx`, `middleware.ts` |
| XROLE-001 | P0 | Customer+Vendor | Status shown in customer orders timeline | Customer view reflects canonical vendor status | `app/api/orders/my/route.ts`, `components/account/tabs/orders-tab.tsx` |
| XROLE-002 | P0 | Customer+Vendor | Email notifications on order placed/status change | One order-placed source and one status-update source | `app/api/notifications/order-placed/route.ts`, `lib/email/order-status-notify.ts` |

## Data Integrity Assertions

- `orders.id` has matching `order_items.order_id`.
- `order_vendor_sub_orders.order_id` matches `orders.id`.
- `vendor_orders.order_id` and `vendor_orders.sub_order_id` are set for new checkout rows.
- For customer cancellation, pending `vendor_orders` for the order should become `cancelled`.
- `order_status_history` should contain append-only timeline entries for all critical transitions.

## Verification Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test:qa`

## Manual Smoke Steps

1. Create order as customer with at least two vendor products.
2. Confirm order appears in vendor panel with pending state.
3. Move vendor order through `confirmed -> preparing -> shipped` and validate customer timeline.
4. Attempt forbidden backward status transition and confirm 422.
5. Request return from eligible delivered order and verify vendor can process it.
6. Check role boundaries by opening `/vendor-panel` and `/admin` with wrong-role user.
