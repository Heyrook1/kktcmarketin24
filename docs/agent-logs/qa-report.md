# QA Report

Generated: 2026-05-02T05:00:23Z

## Scope

- Scanned App Router pages under `app/`.
- Checked required content routes: `/privacy`, `/terms`, `/help`.
- Reviewed homepage product sections, demo/test product visibility, compare feature claims, and public phone consistency.

## Findings and Actions

| Check | Result | Action |
| --- | --- | --- |
| App pages and internal links | Pass with no missing required static routes found in the scanned App Router pages. | Confirmed key linked routes exist, including `/urunler`, `/compare`, `/cart`, `/vendor-login`, `/seller-application`, `/help`, `/privacy`, and `/terms`. |
| `/privacy`, `/terms`, `/help` pages | Pass | Pages already exist under `app/privacy/page.tsx`, `app/terms/page.tsx`, and `app/help/page.tsx`. |
| Homepage stock=0 products | Fixed | Homepage product queries now require `stock > 0` before rendering product sections. |
| Demo products visible | Fixed | Homepage product queries now exclude product names matching `demo` or `test`. |
| `/compare` unavailable features marked available | Fixed | Marketin24 no longer marks mobile app or loyalty program as available. |
| Footer phone consistency | Fixed | Contact page phone was aligned with footer and help page: `+90 533 873 43 17`. |

## Notes

- The cron prompt requested opening a GitHub Issue with label `bug`; this automation environment only has read-only GitHub CLI access and no issue-creation tool, so no issue was created.
