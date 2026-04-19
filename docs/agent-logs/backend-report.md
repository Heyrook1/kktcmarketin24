# Backend API Health Report

Date: 2026-04-19

## Scope

- Reviewed `app/api/**/route.ts` for:
  - missing Zod request validation
  - missing auth checks
  - missing `try/catch` guards
  - price field validation (`min: 1`)
- Applied targeted fixes to high-risk routes.

## Changes Applied

### 1) Zod + try/catch hardening

- `app/api/otp/send/route.ts`
  - Added `otpSendSchema` with UUID validation for `orderId`
  - Wrapped handler in `try/catch`
  - Kept existing auth + ownership logic
- `app/api/otp/verify/route.ts`
  - Added `otpVerifySchema` with UUID + OTP code validation
  - Wrapped handler in `try/catch`
- `app/api/reliability/score/route.ts`
  - Added schema for `POST` payload (`userId`)
  - Added `try/catch` to both `GET` and `POST`
  - Switched role extraction to shared `extractRoleName` helper
- `app/api/vendor/orders/[id]/status/route.ts`
  - Added `statusUpdateSchema`
  - Unified JSON/body validation and error handling
- `app/api/messages/vendor-admin/[threadId]/messages/route.ts`
  - Added `threadMessageSchema` for message content
  - Added `try/catch` in both `GET` and `POST`

### 2) Auth hardening (missing endpoint guard)

- `app/api/notifications/order-placed/route.ts`
  - Added authenticated user requirement
  - Added order ownership verification (`customer_id` / email match)
  - Added Zod request validation for `orderId`

- `app/api/orders/notify/route.ts`
  - Added request validation for `order_id`
  - Added auth guard with internal cron bypass using `CRON_SECRET`
  - Added ownership verification for non-internal requests

### 3) Price validation check

- Existing product validation already enforces minimum price:
  - `lib/validations/product.ts` -> `price.min(1, "Fiyat en az ₺1 olmalıdır.")`
- Routes using this schema (`vendor/products`, `admin/vendors/[id]/bulk-products`) already inherit the rule.
- No additional change required for `min:1` in touched pricing flows.

## TypeScript Check

Command: `pnpm typecheck` (equivalent to `tsc --noEmit`)

Result: **failed due to pre-existing repository-wide type errors outside this patch scope** (and a few existing API typing issues unrelated to these changes).  
No new type errors were introduced by the edited endpoints in this task.

## Notes

- Some API routes still use manual validation patterns and could be migrated to Zod progressively.
- Current patch focused on high-impact auth/validation/error-handling gaps first.
