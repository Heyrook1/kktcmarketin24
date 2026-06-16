# Supabase Control Report

Generated: 2026-05-03T05:02:12Z

## Scope

- Reviewed Supabase client usage across server components, client components, API handlers, auth helpers, and checkout/cart flows.
- Reviewed Redis key conventions used by Supabase-adjacent backend workflows.
- Checked visible query patterns for obvious N+1 risks.

## Findings

### Server/client Supabase usage

- Server components and server routes use `@/lib/supabase/server`, which wraps `createServerClient` from `@supabase/ssr`.
- Client components use `@/lib/supabase/client`, which wraps `createBrowserClient` from `@supabase/ssr`.
- Service-role operations are isolated to server/API code through `@supabase/supabase-js` admin clients; no service-role usage was found in client components.

### N+1 query review

- Messaging list/detail endpoints batch profile/store lookups with `.in(...)` after loading threads/messages.
- Checkout product validation fetches products with `.in("id", productIds)` before iterating over cart items.
- Vendor dashboard pages use a mix of parallel queries and constrained follow-up queries. No high-risk N+1 loop requiring an immediate change was identified in the reviewed backend paths.

### Redis key convention

- Added `lib/redis-keys.ts` as the shared key factory.
- Updated cart/session and stock reservation flows to consume shared key helpers.
- Updated vendor notification writer and reader to consume the same helper.
- Updated public form rate-limit keys to the `entity:id:action` format through `redisKeys.rateLimit(...)`.

## Verification

- Attempted `pnpm typecheck`, but the environment does not have `pnpm`.
- Attempted `corepack pnpm --version`, but the environment also does not have `node`.
- Verification could not be completed until Node.js/pnpm are available in the runner.
