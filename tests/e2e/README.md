# E2E Smoke Scenarios

Manual end-to-end flows for customer/vendor/admin.

## Customer

1. Browse `/urunler` and open any product detail.
2. Add to cart and place order.
3. Open order history and verify status/timeline.
4. Attempt cancel while pending (allowed) and after vendor confirms (blocked).

## Vendor

1. Sign in as vendor and open `/vendor-panel/orders`.
2. Move status through `pending -> confirmed -> preparing -> shipped`.
3. Validate tracking number only on shipped transition.
4. Validate customer side timeline reflects transitions.

## Admin

1. Sign in as admin and open `/admin/dashboard`.
2. Verify non-admin account is redirected from `/admin/*`.
3. Verify non-vendor account is redirected from `/vendor-panel/*`.

## Quick Regression Command

- `npm run test:qa`
