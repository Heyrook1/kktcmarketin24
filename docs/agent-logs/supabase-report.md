# Supabase Control Report

Generated: 2026-05-05T05:00:00Z

## Scope

- Reviewed Supabase server/client helper usage across API routes, Server Components, Client Components, and shared libraries.
- Reviewed Redis key patterns used by API routes touched by this pass.

## Supabase client usage

### Server-side cookie client

- `lib/supabase/server.ts` wraps `createServerClient` from `@supabase/ssr`.
- Existing API/auth helpers such as `lib/vendor-auth.ts`, `lib/admin-auth.ts`, `/api/search`, `/api/cart/*`, `/api/otp/*`, and `/api/reliability/score` use the server helper when they need the authenticated user from cookies.
- Direct `createServerClient` usage in `proxy.ts` and `app/auth/callback/route.ts` is intentional because those paths need custom cookie handling.

### Browser client

- `lib/supabase/client.ts` wraps `createBrowserClient`.
- Client-side auth and UI flows import that wrapper rather than creating browser clients directly.

### Service-role clients

- Privileged reads/writes continue to use service-role clients from `@supabase/supabase-js`.
- The routes changed in this pass keep service-role usage behind explicit auth checks:
  - Vendor/admin ownership checks before status and delivery-event mutations.
  - Signed-in user checks before OTP and reliability operations.
  - Bearer-secret checks before internal notification triggers and outbox worker execution.

## Redis key convention

Updated vendor notification keys to the `entity:id:action` shape:

- New write key: `vendor:${storeId}:notify` in `app/api/worker/outbox-flush/route.ts`.
- New read key: `vendor:${storeId}:notify` in `app/api/vendor/notifications/route.ts`.
- Temporary legacy fallback remains for `vendor:notify:${storeId}` so existing unread notifications are not lost during deployment.

Remaining Redis keys still outside strict `entity:id:action` convention and should be migrated in a separate compatibility pass:

- `cart:session:${userId}` in cart server / checkout confirmation.
- `cart:reserve:{cartId}:{productId}` in stock reservation helpers.
- `otp:{orderId}` and `otp:rate:{phone}` in OTP helpers.
- `rl:contact:{ip}` in contact and seller-application rate limits.

## N+1 / query-shape review

- No new N+1 query loops were introduced.
- `app/api/vendor/orders/[id]/delivery-event/route.ts` still performs multiple sequential lookups for legacy order matching. This is bounded (`limit(50)`) and not a classic unbounded N+1 loop.
- `app/api/search/route.ts` continues to use a single product query with joined store data; vendor slug lookup is one additional query only when the vendor filter is present.

## Verification

- `git diff --check HEAD`: passed.
- `pnpm typecheck`: blocked because `pnpm` is not installed in the runner.
- `corepack pnpm typecheck`: blocked because `corepack` is not installed.
- `node --version && npm --version && npx --version`: blocked because `node` is not installed.
