# API Regression Scenarios

These scenarios back the cross-role QA matrix.

## Scope

- Checkout order creation with stock decrement
- Vendor status transition workflow
- Customer cancellation safeguards
- Returns eligibility and transition workflow
- Notification idempotency and shared email pipeline

## Execution

1. Start app with `npm run dev`
2. Execute automated guardrails: `npm run test:qa`
3. Run API calls from `docs/qa-cross-role-checklist.md` against local/dev environment

## Minimum Pass Criteria

- Invalid status transitions return 422 with allowed next statuses.
- Cancel rejects when any vendor row is no longer `pending`.
- Return creation rejects non-delivered orders and expired windows.
- Notification endpoint does not duplicate order-placed emails for same order.
