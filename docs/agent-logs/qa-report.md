# QA Report

Generated: 2026-05-06

## Scope

- Reviewed App Router pages under `app/`.
- Verified required public support/legal routes.
- Checked public product visibility rules for homepage/list/search/detail surfaces.
- Checked `/compare` feature claims.
- Checked public footer/contact phone consistency.

## Findings and actions

| Check | Result | Action |
| --- | --- | --- |
| Broken internal links in `app/` pages | No missing static route targets found during code review. Dynamic routes and query-string links resolve to existing route patterns. | No code change needed. |
| `/privacy`, `/terms`, `/help` pages | Present. | No code change needed. |
| Homepage stock=0 products | Product sections could receive active DB products with zero stock. | Added shared public visibility filtering so homepage product sections exclude zero-stock products. |
| Demo products visible | Demo/test/sample/placeholder-tagged products could be displayed by public product queries. | Added shared hidden-tag filtering across homepage, listings, category pages, search API, and product detail related items. |
| `/compare` unavailable feature claims | Marketin24 was marked as having a mobile app and loyalty program. | Marked those features as unavailable until shipped. |
| Footer phone consistency | Footer and help page used `+90 533 873 43 17`; contact page used a placeholder landline. | Updated contact page to `+90 533 873 43 17` and `tel:+905338734317`. |

## Notes

- The automation requested opening a GitHub issue with label `bug`; repository instructions in this environment make GitHub CLI read-only for issue/PR writes, so no issue was opened.
- Product visibility is centralized in `lib/product-visibility.ts` to keep public surfaces aligned.
