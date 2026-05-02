# Backend API Health Report

Generated: 2026-05-02

## Scope

- Reviewed `app/api/**/route.ts` for request validation, auth/ownership checks, outer error handling, and price validation.
- Implemented focused fixes in routes with user-supplied input or sensitive backend behavior.

## Changes made

- `app/api/search/route.ts`
  - Added Zod query validation for search parameters.
  - Enforced `min_price` and `max_price` as finite numbers with `min(1)`.
  - Added price range validation (`min_price <= max_price`).
  - Added an outer `try/catch` and replaced internal error detail exposure with a user-safe response.

- `app/api/otp/send/route.ts`
  - Added Zod body validation for `orderId` as UUID.
  - Added JSON parse hardening and an outer `try/catch`.
  - Preserved existing signed-in user and order ownership checks.

- `app/api/otp/verify/route.ts`
  - Added Zod body validation for `orderId` and `code`.
  - Added JSON parse hardening and an outer `try/catch`.
  - Preserved existing signed-in user validation.

- `app/api/reliability/score/route.ts`
  - Added Zod validation for `customerId` and `userId`.
  - Added outer `try/catch` around both handlers.
  - Aligned admin checks to allow both `admin` and `super_admin`, matching shared admin auth behavior.

- `app/api/orders/[id]/no-show/route.ts`
  - Added an outer `try/catch`.
  - Reused `extractRoleName` and aligned admin bypass to include `super_admin`.
  - Preserved UUID route-param validation and vendor ownership checks.

- `app/api/vendor/notifications/route.ts`
  - Added Zod validation for `storeId` and `limit`.
  - Added an outer `try/catch`.
  - Preserved authenticated vendor store ownership check.

- `app/api/cart/reserve/route.ts`
  - Added Zod body validation for `cartId`, `productId`, and integer `quantity >= 1`.
  - Removed production `console.error`.

- `app/api/cart/release/route.ts`
  - Added Zod body validation for `cartId` and optional `productId`.
  - Removed production `console.error`.

- `app/api/worker/outbox-flush/route.ts`
  - Updated the vendor notification Redis key written by the worker to `vendor:{storeId}:notify`.

## Auth and ownership findings

- Vendor product routes already use vendor session/ownership helpers.
- OTP routes already require an authenticated user and verify order ownership; validation/error handling was added.
- Reliability and no-show routes had admin-role edge cases where `super_admin` was not recognized; fixed.
- Vendor notification polling still verifies that the authenticated user owns the requested store before reading Redis notifications.

## Price validation findings

- Product create/update validation already enforces `price >= 1` in `lib/validations/product.ts`.
- Bulk vendor product import reuses the product validation schema.
- Checkout order placement does not accept client-supplied item prices for charging.
- Search price filters now require finite values with `min(1)` and a valid range.

## Verification

- `pnpm typecheck` could not run because `pnpm` is not installed in the container (`pnpm: command not found`).
- `npx tsc --noEmit` could not run because `node` is not installed in the container (`node: command not found`).
- TypeScript verification should be rerun in CI or a Node-enabled environment.
