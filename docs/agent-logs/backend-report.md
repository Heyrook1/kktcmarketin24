# Backend API Health Report

Generated: 2026-05-05T05:00:00Z

## Summary

- Hardened internal notification endpoints with Bearer-token authorization.
- Added Zod validation to high-risk request/query boundaries:
  - `/api/orders/notify`
  - `/api/notifications/order-placed`
  - `/api/search`
  - `/api/cart/reserve`
  - `/api/cart/release`
  - `/api/checkout/coupon`
  - `/api/vendor/notifications`
  - `/api/otp/send`
  - `/api/otp/verify`
  - `/api/reliability/score`
  - `/api/vendor/orders/[id]/status`
  - `/api/vendor/orders/[id]/delivery-event`
  - `/api/orders/[id]/delivery-event`
- Added top-level try/catch protection to previously unwrapped worker/search/OTP/reliability/vendor notification and delivery-event paths.
- Confirmed product create/patch validation already enforces `price >= 1` in `lib/validations/product.ts`.
- Added `min_price` and `max_price` query validation with `min(1)` in `/api/search`.

## Auth Review

- `/api/worker/outbox-flush` now requires `CRON_SECRET` and rejects requests when it is missing or invalid.
- `/api/orders/notify` now requires `NOTIFICATION_WEBHOOK_SECRET` or `CRON_SECRET`.
- `/api/notifications/order-placed` now requires `NOTIFICATION_WEBHOOK_SECRET` or `CRON_SECRET`.
- Existing vendor/admin/customer ownership checks were preserved for vendor product, order status, delivery event, reliability, OTP, and vendor notification endpoints.

## Validation Review

- Added Zod UUID checks for order IDs, product IDs, store IDs, and reliability user IDs.
- Added bounded integer validation for reservation quantity and notification limit.
- Added coupon code trimming and length validation.
- Added delivery-event enum validation and notes length limits.
- Added search query validation, including page bounds and price range consistency.

## Error Handling Review

- Added top-level route handler try/catch where missing on touched operational and user-facing routes.
- New catch blocks return localized generic errors and avoid exposing internal exception details.

## Verification

- `git diff --check HEAD`: passed.
- `pnpm typecheck`: not executed because this runner does not have `pnpm`, `corepack`, `node`, `npm`, or `npx` installed.
  - `pnpm typecheck` result: `pnpm: command not found`
  - `corepack pnpm typecheck` result: `corepack: command not found`
  - `node --version && npm --version && npx --version` result: `node: command not found`

## Remaining Follow-up Candidates

- Several lower-risk routes still use manual validation patterns and should be migrated in a later pass:
  - admin vendor create/update
  - returns create/update
  - checkout confirm
  - cart server
  - messaging POST endpoints
  - auth email/reset helpers
- Some pre-existing production routes still use `console.error` / `console.warn`; this pass avoided adding new console usage to touched catch blocks.
