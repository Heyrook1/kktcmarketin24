# QA Report

Generated: 2026-05-05

## Scope

- Scanned `app/` routes for broken internal links and required legal/help pages.
- Checked home/public product surfaces for out-of-stock and demo-tagged products.
- Checked `/compare` feature claims against implemented platform capabilities.
- Checked footer/help phone number consistency.

## Findings and actions

| Check | Result | Action |
| --- | --- | --- |
| `/privacy`, `/terms`, `/help` pages | Present | No page creation needed. |
| Broken internal links in scanned pages/components | No missing local routes found in the checked links | No action needed. |
| Home page shows `stock = 0` products | Risk found in product queries | Added shared public product filtering and applied it to home product sections. |
| Demo products visible publicly | Risk found for `demo` tags/names | Added shared filtering for demo-tagged/demo-named products across public product surfaces. |
| `/compare` marks unavailable features | Found Marketin24 mobile app and loyalty program marked available | Changed Marketin24 flags to unavailable until those features exist. |
| Footer phone consistency | `+90 533 873 43 17` consistent in footer/help/terms | No action needed. |

## Public product visibility coverage

The shared helper in `lib/public-product-visibility.ts` now enforces:

- `stock > 0`
- no `demo` tag
- no `demo` marker in product name for in-memory fallback checks

Applied to:

- `components/home/featured-products.tsx`
- `app/urunler/page.tsx`
- `app/categories/page.tsx`
- `app/category/[slug]/page.tsx`
- `app/vendor/[slug]/page.tsx`
- `app/api/search/route.ts`
- `app/products/[id]/page.tsx`
- `app/urunler/[id]/page.tsx`

## GitHub issue

No GitHub issue was opened because this environment only exposes authenticated `gh` in read-only mode and no issue-creation tool is available. The findings are documented here and included in the branch/PR changes.
