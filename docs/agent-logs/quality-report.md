# Quality Report

Generated: 2026-05-05T05:02:00Z

## Requested commands

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test:qa`

## Result

Blocked by the execution environment: `pnpm`, `npm`, and `node` are not installed or not available on `PATH`.

Observed command output:

```text
pnpm: command not found
node: command not found
```

## Manual checks completed

- Reviewed TypeScript changes for import consistency and unused helper usage.
- Ran `git diff --check`; no whitespace errors were reported.
- Confirmed `/privacy`, `/terms`, and `/help` pages exist.
- Confirmed footer/help phone number uses `+90 533 873 43 17`.
- Confirmed public product visibility rules are now applied to home, product listing, category, vendor, detail, related products, search API, and category counts.

## Follow-up needed

Run the requested package scripts in an environment with Node.js and pnpm available:

```bash
pnpm typecheck && pnpm lint && pnpm test:qa
```
