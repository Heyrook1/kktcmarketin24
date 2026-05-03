# Backend API Health Report

Generated: 2026-05-03T05:02:12Z

## Scope

- Scanned `app/api/**/route.ts` for request validation, authentication/authorization, error handling, and price validation.
- Focused fixes on request-body endpoints and shared validation used by product creation/update.

## Changes made

- Added Zod validation to:
  - `app/api/cart/server/route.ts`
  - `app/api/cart/reserve/route.ts`
  - `app/api/cart/release/route.ts`
  - `app/api/checkout/coupon/route.ts`
  - `app/api/checkout/confirm/route.ts`
  - `app/api/contact/route.ts`
- Preserved auth checks on authenticated cart and checkout endpoints.
- Kept public contact/seller application endpoints unauthenticated intentionally; they are protected by Turnstile and Redis rate limiting.
- Standardized malformed JSON handling so invalid JSON returns a controlled `400` response where appropriate.
- Fixed product price validation:
  - `price` already enforced `min(1)`.
  - `compare_price` now also enforces `min(1)` when present.
- Removed production `console.warn` usage from touched backend order flows.

## Findings

- Vendor product endpoints already use shared Zod schemas and vendor ownership guards.
- Admin bulk product creation already uses the same product creation schema, so it benefits from the price validation fix.
- Most sensitive vendor/admin/order endpoints already have explicit auth or ownership checks.
- Some public utility endpoints intentionally avoid auth:
  - Contact form
  - Seller application form
  - Email/reset flows
  - Stock reservation helper endpoints

## Verification

- `pnpm typecheck` could not be executed because the environment does not have `pnpm` installed.
- `node --version` also failed because `node` is unavailable in the shell environment.
- `git diff --check` passed before the first commit.

## Follow-up recommendations

- Run `pnpm typecheck` and `pnpm lint` in CI or a local environment with Node/pnpm installed.
- Consider adding Zod schemas to remaining manual-body endpoints when those route surfaces are next touched.
