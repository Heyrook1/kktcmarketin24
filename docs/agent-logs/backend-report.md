# Backend API Health Report

Generated: 2026-05-06

## Scope

- Reviewed `app/api/**/route.ts` handlers for missing boundary validation, authentication checks, error handling, and price validation.
- Focused fixes on routes with clear runtime risk or security impact.

## Changes made

- Added Zod request-body validation and guarded JSON parsing to:
  - `app/api/otp/send/route.ts`
  - `app/api/otp/verify/route.ts`
- Added Zod query validation and guarded error handling to `app/api/search/route.ts`.
  - `min_price` and `max_price` must now be finite numbers greater than or equal to 1 when provided.
  - Rejects `min_price > max_price`.
- Enforced minimum price validation for optional product `compare_price` via `lib/validations/product.ts`.
- Added Zod boundary validation and outer error handling for public form endpoints while preserving generic anti-enumeration responses:
  - `app/api/contact/route.ts`
  - `app/api/seller-application/route.ts`
- Fixed contact form rate limiting so a single submission only consumes one Redis sliding-window entry.

## Authentication review

- OTP endpoints already require an authenticated Supabase user via `createClient` from `@/lib/supabase/server`.
- Search remains public by design.
- Contact and seller application remain public by design and rely on Turnstile plus Redis rate limiting.
- Vendor/admin routes use existing helpers such as `resolveVendorSession`, `assertVendorOrderOwnership`, and `assertAdminAuth` in the higher-risk authenticated areas reviewed.

## Verification

- `pnpm typecheck` could not run because `pnpm` is not installed in this execution environment.
- `node`, `npm`, and `corepack` are also unavailable, so `tsc --noEmit` could not be executed through an alternate package-manager path.
